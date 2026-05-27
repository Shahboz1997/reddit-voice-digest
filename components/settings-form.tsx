"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  defaultElevenLabsVoiceIdForPersona,
  ELEVENLABS_VOICE_CATALOG,
  isKnownElevenLabsVoiceId,
  PERSONAS,
  SUMMARY_DEPTHS,
} from "@/lib/digest-persona";
import { SubredditPriorityQueue } from "@/components/subreddit-priority-queue";
import { SubredditStationGrid } from "@/components/subreddit-station-grid";
import { createToast, Toast, type ToastMessage } from "@/components/toast";
import { COMMON_TIMEZONES } from "@/lib/delivery/timezone-options";
import type {
  NotificationPreference,
  PersonaId,
  SourceSeed,
  SummaryDepthId,
} from "@/lib/types";

interface SettingsFormProps {
  availableSources: SourceSeed[];
  defaultSubreddits: string[];
  defaultNotifications: NotificationPreference[];
  rssUrl: string;
}

const preferencesStorageKey = "reddit-voice-digest.preferences";

interface LocalPreferences {
  subreddits: string[];
  notifications: NotificationPreference[];
  persona: PersonaId;
  summaryDepth: SummaryDepthId;
  deliveryLocalTime: string | null;
  deliveryWeekdaysOnly: boolean;
  timezone: string;
  elevenlabsVoiceId: string | null;
}

function depthIndex(id: SummaryDepthId) {
  const i = SUMMARY_DEPTHS.findIndex((row) => row.id === id);
  return i >= 0 ? i : 1;
}

export function SettingsForm({
  availableSources,
  defaultSubreddits,
  defaultNotifications,
  rssUrl,
}: SettingsFormProps) {
  const [subreddits, setSubreddits] = useState<string[]>(defaultSubreddits);
  const [notifications, setNotifications] = useState<NotificationPreference[]>(defaultNotifications);
  const [persona, setPersona] = useState<PersonaId>("news_anchor");
  const [elevenlabsVoiceId, setElevenlabsVoiceId] = useState<string | null>(null);
  const [customVoiceDraft, setCustomVoiceDraft] = useState("");
  const [showCustomVoice, setShowCustomVoice] = useState(false);
  const [summaryDepth, setSummaryDepth] = useState<SummaryDepthId>("standard");
  const [deliveryLocalTime, setDeliveryLocalTime] = useState("");
  const [deliveryWeekdaysOnly, setDeliveryWeekdaysOnly] = useState(false);
  const [timezone, setTimezone] = useState("UTC");
  const [displayRssUrl, setDisplayRssUrl] = useState(rssUrl);
  const [userApiRssUrl, setUserApiRssUrl] = useState<string | null>(null);
  const [status, setStatus] = useState("Changes are saved locally and to Supabase after you sign in.");
  const [isSaving, setIsSaving] = useState(false);
  const [onDemandBusy, setOnDemandBusy] = useState(false);
  const [onDemandMessage, setOnDemandMessage] = useState<string | null>(null);
  const [redditPostReference, setRedditPostReference] = useState("");
  const [episodeMode, setEpisodeMode] = useState<"multi" | "single_thread">("multi");
  const [queueInBackground, setQueueInBackground] = useState(false);
  const [deliveryStatusLine, setDeliveryStatusLine] = useState<string | null>(null);
  const [lastDeliveryDigestSlug, setLastDeliveryDigestSlug] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const loadDeliveryStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/delivery/status", { cache: "no-store" });
      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as {
        headline?: string;
        lastRun?: { digestSlug?: string | null };
      };

      setDeliveryStatusLine(payload.headline ?? null);
      setLastDeliveryDigestSlug(payload.lastRun?.digestSlug ?? null);
    } catch {
      // Ignore when signed out or delivery tables are not migrated yet.
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadPreferences() {
      try {
        const response = await fetch("/api/preferences", { cache: "no-store" });

        if (!response.ok) {
          throw new Error("remote");
        }

        const payload = (await response.json()) as Partial<LocalPreferences> & {
          notifications?: NotificationPreference[];
          personalRssUrl?: string | null;
          userApiRssUrl?: string | null;
          source?: string;
        };

        if (!ignore) {
          if (payload.subreddits?.length) {
            setSubreddits(payload.subreddits);
          }

          if (payload.notifications?.length) {
            setNotifications(payload.notifications);
          }

          if (payload.persona) {
            setPersona(payload.persona);
          }

          if (payload.elevenlabsVoiceId !== undefined) {
            setElevenlabsVoiceId(payload.elevenlabsVoiceId);
            if (payload.elevenlabsVoiceId && !isKnownElevenLabsVoiceId(payload.elevenlabsVoiceId)) {
              setCustomVoiceDraft(payload.elevenlabsVoiceId);
              setShowCustomVoice(true);
            }
          }

          if (payload.summaryDepth) {
            setSummaryDepth(payload.summaryDepth);
          }

          if (payload.deliveryLocalTime !== undefined) {
            setDeliveryLocalTime(payload.deliveryLocalTime ?? "");
          }

          setDeliveryWeekdaysOnly(Boolean(payload.deliveryWeekdaysOnly));
          if (typeof payload.timezone === "string" && payload.timezone) {
            setTimezone(payload.timezone);
          }

          if (typeof payload.userApiRssUrl === "string") {
            setUserApiRssUrl(payload.userApiRssUrl);
          }

          if (payload.source === "remote") {
            setStatus("Settings loaded from Supabase.");
            setDisplayRssUrl(payload.personalRssUrl?.trim() || rssUrl);
            void loadDeliveryStatus();
          } else if (payload.personalRssUrl) {
            setDisplayRssUrl(payload.personalRssUrl);
          }
        }
      } catch {
        try {
          const raw = window.localStorage.getItem(preferencesStorageKey);
          if (!raw) return;
          const parsed = JSON.parse(raw) as Partial<LocalPreferences> & {
            notifications?: NotificationPreference[];
          };
          if (!ignore) {
            if (parsed.subreddits?.length) setSubreddits(parsed.subreddits);
            if (parsed.notifications?.length) setNotifications(parsed.notifications);
            if (parsed.persona) setPersona(parsed.persona);
            if (parsed.elevenlabsVoiceId !== undefined) {
              setElevenlabsVoiceId(parsed.elevenlabsVoiceId);
              if (parsed.elevenlabsVoiceId && !isKnownElevenLabsVoiceId(parsed.elevenlabsVoiceId)) {
                setCustomVoiceDraft(parsed.elevenlabsVoiceId);
                setShowCustomVoice(true);
              }
            }
            if (parsed.summaryDepth) setSummaryDepth(parsed.summaryDepth);
            if (parsed.deliveryLocalTime !== undefined) setDeliveryLocalTime(parsed.deliveryLocalTime ?? "");
            setDeliveryWeekdaysOnly(Boolean(parsed.deliveryWeekdaysOnly));
            if (typeof parsed.timezone === "string" && parsed.timezone) {
              setTimezone(parsed.timezone);
            }
          }
        } catch {
          // ignore malformed local storage and use defaults
        }
      }
    }

    void loadPreferences();
    return () => {
      ignore = true;
    };
  }, [loadDeliveryStatus, rssUrl]);

  const hasTelegramEnabled = useMemo(() => {
    return notifications.some((item) => item.channelType === "telegram" && item.isEnabled);
  }, [notifications]);

  const catalogSorted = useMemo(() => {
    return [...availableSources].sort((a, b) => b.priority - a.priority);
  }, [availableSources]);

  const personaDefaultVoiceId = useMemo(
    () => defaultElevenLabsVoiceIdForPersona(persona),
    [persona],
  );

  const customVoiceActive =
    Boolean(elevenlabsVoiceId) && !isKnownElevenLabsVoiceId(elevenlabsVoiceId ?? "");

  function removeSubreddit(name: string) {
    setSubreddits((current) => current.filter((entry) => entry !== name));
  }

  function toggleSubreddit(name: string) {
    setSubreddits((current) =>
      current.includes(name) ? current.filter((entry) => entry !== name) : [...current, name],
    );
  }

  function moveSubreddit(fromIndex: number, toIndex: number) {
    setSubreddits((current) => {
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) {
        return current;
      }
      const clone = [...current];
      const [item] = clone.splice(fromIndex, 1);
      if (!item) {
        return current;
      }
      clone.splice(toIndex, 0, item);
      return clone;
    });
  }

  function toggleNotification(channelType: NotificationPreference["channelType"]) {
    setNotifications((current) =>
      current.map((item) =>
        item.channelType === channelType ? { ...item, isEnabled: !item.isEnabled } : item,
      ),
    );
  }

  function updateNotificationTarget(channelType: NotificationPreference["channelType"], targetValue: string) {
    setNotifications((current) =>
      current.map((item) => (item.channelType === channelType ? { ...item, targetValue } : item)),
    );
  }

  async function handleOnDemandDigest() {
    setOnDemandBusy(true);
    setOnDemandMessage(null);

    try {
      const response = await fetch("/api/user/digest/on-demand", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          redditPostReference: redditPostReference.trim() || undefined,
          episodeMode: redditPostReference.trim() ? "single_thread" : episodeMode,
          async: queueInBackground,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        queued?: boolean;
        jobId?: string;
        result?: { title?: string; slug?: string };
      };

      if (!response.ok) {
        const text =
          data.error ??
          (response.status === 401
            ? "Sign in to your account, then try again."
            : response.status === 503
              ? "Server missing service role or pipeline unavailable."
              : "Could not start generation.");
        setOnDemandMessage(text);
        return;
      }

      if (data.queued && data.jobId) {
        setOnDemandMessage(
          `Queued in background (job ${data.jobId.slice(0, 8)}…). The worker will publish the episode to your RSS when ready.`,
        );
        return;
      }

      if (data.ok && data.result?.title) {
        void loadDeliveryStatus();
        setOnDemandMessage(
          `Done: “${data.result.title}”. The episode will appear in your personal RSS and archive (slug: ${data.result.slug}).`,
        );
      } else {
        setOnDemandMessage("Generation completed successfully.");
      }
    } catch {
      setOnDemandMessage("Network unavailable or request was cancelled.");
    } finally {
      setOnDemandBusy(false);
    }
  }

  function resolveElevenlabsVoiceForSave(): string | null {
    if (showCustomVoice || customVoiceActive) {
      const trimmed = customVoiceDraft.trim();
      return trimmed.length >= 16 ? trimmed : elevenlabsVoiceId;
    }

    return elevenlabsVoiceId;
  }

  async function handleSave() {
    setIsSaving(true);

    const payload = {
      subreddits,
      notifications,
      persona,
      summaryDepth,
      deliveryLocalTime: deliveryLocalTime || null,
      deliveryWeekdaysOnly,
      timezone,
      elevenlabsVoiceId: resolveElevenlabsVoiceForSave(),
    };

    const savedVoiceId = payload.elevenlabsVoiceId;
    setElevenlabsVoiceId(savedVoiceId);
    window.localStorage.setItem(
      preferencesStorageKey,
      JSON.stringify({
        subreddits,
        notifications,
        persona,
        summaryDepth,
        deliveryLocalTime: deliveryLocalTime || null,
        deliveryWeekdaysOnly,
        timezone,
        elevenlabsVoiceId: savedVoiceId,
      }),
    );

    try {
      const response = await fetch("/api/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        if (typeof data.personalRssUrl === "string" && data.personalRssUrl) {
          setDisplayRssUrl(data.personalRssUrl);
        }
        if (typeof data.userApiRssUrl === "string" && data.userApiRssUrl) {
          setUserApiRssUrl(data.userApiRssUrl);
        }
        setStatus("Synced with your account.");
        setToast(createToast("Saved", "success"));
        void loadDeliveryStatus();
      } else if (response.status === 401) {
        setStatus("Stored on this device. Sign in to sync to the cloud.");
        setToast(createToast("Saved locally", "success"));
      } else {
        setStatus("Stored on this device. Server sync failed — try again later.");
        setToast(createToast("Saved locally", "info"));
      }
    } catch {
      setStatus("Stored on this device. Check your connection.");
      setToast(createToast("Saved locally", "info"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
    <Toast onDismiss={() => setToast(null)} toast={toast} />
    <div className="app-ui grid gap-6 xl:grid-cols-[1fr_380px]">
      <div className="min-w-0 space-y-6">
        <section className="spotify-panel px-5 py-6 sm:px-8 sm:py-8">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--app-text)] sm:text-4xl">Your library</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--app-text-muted)]">
            Pick Reddit communities for your daily mix. Reorder the queue to control which topics lead each episode.
          </p>

          <div className="mt-8">
            <SubredditStationGrid
              onToggle={toggleSubreddit}
              selected={subreddits}
              sources={catalogSorted}
            />
          </div>

          <p className="sticky bottom-[calc(var(--mobile-nav-height)+0.75rem)] z-10 mt-4 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-center text-sm font-semibold text-[var(--app-text)] shadow-lg sm:static sm:mt-6 sm:shadow-none">
            {subreddits.length} station{subreddits.length === 1 ? "" : "s"} selected
          </p>
        </section>

        <section className="spotify-panel px-5 py-5 sm:px-8">
          <h2 className="text-xl font-bold text-[var(--app-text)]">Queue</h2>
          <p className="mt-1 text-sm text-[var(--app-text-muted)]">Top = highest priority in the digest.</p>
          <div className="mt-4">
            <SubredditPriorityQueue
              dragIndex={dragIndex}
              onDragIndexChange={setDragIndex}
              onMove={moveSubreddit}
              onRemove={removeSubreddit}
              subreddits={subreddits}
            />
          </div>
        </section>

        <section className="spotify-panel px-5 py-5 sm:px-8">
          <h2 className="text-xl font-bold text-[var(--app-text)]">Voice & summary</h2>
          <div className="mt-4 space-y-3">
            {PERSONAS.map((row) => (
              <label
                key={row.id}
                className={`flex cursor-pointer flex-col rounded-md border px-4 py-3 text-left transition ${
                  persona === row.id
                    ? "border-[var(--spotify-green)]/60 bg-[var(--spotify-highlight)]"
                    : "border-transparent bg-[var(--spotify-elevated)] hover:bg-[var(--app-surface-elevated)]"
                }`}
              >
                <span className="flex items-start gap-3">
                  <input
                    checked={persona === row.id}
                    className="mt-1"
                    name="persona"
                    onChange={() => setPersona(row.id)}
                    type="radio"
                  />
                  <span>
                    <span className="text-sm font-medium text-[var(--app-text)]">{row.label}</span>
                    <span className="mt-1 block text-xs leading-5 text-[var(--app-text-muted)]">{row.hint}</span>
                    <span className="mt-1 block text-[11px] text-[var(--app-text-muted)]">
                      Changes OpenAI instructions for summary/script and TTS voice (ElevenLabs or OpenAI — see AUDIO_PROVIDER).
                    </span>
                  </span>
                </span>
              </label>
            ))}
          </div>

          <div className="mt-8 border-t border-[var(--app-border)] pt-6">
            <p className="mt-2 text-sm font-semibold text-[var(--app-text)]">Narrator (ElevenLabs)</p>
            <p className="mt-2 text-xs leading-5 text-[var(--app-text-muted)]">
              When AUDIO_PROVIDER=elevenlabs, controls narration. Auto picks a voice for your persona (currently:{" "}
              {ELEVENLABS_VOICE_CATALOG.find((v) => v.id === personaDefaultVoiceId)?.name ?? "—"}).
            </p>

            <div className="mt-4 space-y-2">
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-md border px-4 py-3 transition ${
                  !elevenlabsVoiceId && !customVoiceActive
                    ? "border-[var(--spotify-green)]/60 bg-[var(--spotify-highlight)]"
                    : "border-transparent bg-[var(--spotify-elevated)] hover:bg-[var(--app-surface-elevated)]"
                }`}
              >
                <input
                  checked={!elevenlabsVoiceId && !customVoiceActive}
                  className="mt-1"
                  name="elevenlabsVoice"
                  onChange={() => {
                    setElevenlabsVoiceId(null);
                    setShowCustomVoice(false);
                    setCustomVoiceDraft("");
                  }}
                  type="radio"
                />
                <span>
                  <span className="text-sm font-medium text-[var(--app-text)]">Auto (by persona)</span>
                  <span className="mt-1 block text-xs text-[var(--app-text-muted)]">
                    Recommended — updates with the voice & vibe selection above.
                  </span>
                </span>
              </label>

              {ELEVENLABS_VOICE_CATALOG.map((voice) => {
                const selected = elevenlabsVoiceId === voice.id;
                const recommended = voice.recommendedPersonas.includes(persona);

                return (
                  <label
                    key={voice.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-md border px-4 py-3 transition ${
                      selected
                        ? "border-[var(--spotify-green)]/60 bg-[var(--spotify-highlight)]"
                        : "border-transparent bg-[var(--spotify-elevated)] hover:bg-[var(--app-surface-elevated)]"
                    }`}
                  >
                    <input
                      checked={selected}
                      className="mt-1"
                      name="elevenlabsVoice"
                      onChange={() => {
                        setElevenlabsVoiceId(voice.id);
                        setShowCustomVoice(false);
                        setCustomVoiceDraft("");
                      }}
                      type="radio"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-[var(--app-text)]">{voice.name}</span>
                        {recommended ? (
                          <span className="rounded-full bg-[var(--spotify-green)]/20 px-2 py-0.5 text-[10px] font-medium text-[var(--spotify-green)]">
                            for persona
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-[var(--app-text-muted)]">{voice.hint}</span>
                    </span>
                  </label>
                );
              })}

              <label
                className={`flex cursor-pointer items-start gap-3 rounded-md border px-4 py-3 transition ${
                  customVoiceActive || showCustomVoice
                    ? "border-[var(--spotify-green)]/60 bg-[var(--spotify-highlight)]"
                    : "border-transparent bg-[var(--spotify-elevated)] hover:bg-[var(--app-surface-elevated)]"
                }`}
              >
                <input
                  checked={customVoiceActive || showCustomVoice}
                  className="mt-1"
                  name="elevenlabsVoice"
                  onChange={() => setShowCustomVoice(true)}
                  type="radio"
                />
                <span className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-[var(--app-text)]">Custom voice ID</span>
                  <span className="mt-1 block text-xs text-[var(--app-text-muted)]">
                    From ElevenLabs → Voices → copy a clone or premade voice ID.
                  </span>
                  {showCustomVoice || customVoiceActive ? (
                    <input
                      className="mt-3 w-full rounded-md border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 font-mono text-xs text-[var(--app-text)] placeholder:text-[var(--app-text-muted)]"
                      onChange={(event) => setCustomVoiceDraft(event.target.value)}
                      placeholder="e.g. pNInz6obpgDQGcFmaJgB"
                      spellCheck={false}
                      value={customVoiceDraft}
                    />
                  ) : null}
                </span>
              </label>
            </div>
          </div>

          <p className="mt-8 text-sm font-semibold text-[var(--app-text)]">Summary depth</p>
          <div className="mt-4">
            <input
              className="w-full accent-[var(--spotify-green)]"
              max={SUMMARY_DEPTHS.length - 1}
              min={0}
              onChange={(e) => setSummaryDepth(SUMMARY_DEPTHS[Number(e.target.value)].id)}
              step={1}
              type="range"
              value={depthIndex(summaryDepth)}
            />
            <div className="mt-2 flex justify-between gap-3 text-[11px] text-[var(--app-text-muted)]">
              {SUMMARY_DEPTHS.map((row) => (
                <span
                  key={row.id}
                  className={summaryDepth === row.id ? "font-semibold text-[var(--spotify-green)]" : undefined}
                  style={{ flex: "1 1 0" }}
                >
                  {row.label}
                </span>
              ))}
            </div>
          </div>
        </section>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
        <section className="spotify-panel p-5">
          <h2 className="text-lg font-bold text-[var(--app-text)]">Delivery</h2>
          <p className="mt-1 text-sm text-[var(--app-text-muted)]">RSS, schedule, and notifications.</p>

          <div className="mt-5 rounded-md bg-[var(--spotify-elevated)] p-4">
            <p className="text-sm font-medium text-[var(--app-text)]">Scheduled delivery</p>
            <p className="mt-2 text-sm text-[var(--app-text-muted)]">
              When you enable a channel below and connect a worker/cron to these fields, the digest can be delivered daily at your chosen time.
            </p>
            <label className="mt-4 block text-xs font-medium text-[var(--app-text-muted)]" htmlFor="delivery-time">
              Local time
            </label>
            <input
              className="mt-2 w-full rounded-md border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)] outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
              id="delivery-time"
              onChange={(event) => setDeliveryLocalTime(event.target.value)}
              type="time"
              value={deliveryLocalTime}
            />
            <label className="mt-4 block text-xs font-medium text-[var(--app-text-muted)]" htmlFor="delivery-timezone">
              Timezone
            </label>
            <select
              className="mt-2 w-full rounded-md border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)] outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
              id="delivery-timezone"
              onChange={(event) => setTimezone(event.target.value)}
              value={timezone}
            >
              {COMMON_TIMEZONES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} ({option.value})
                </option>
              ))}
            </select>
            {deliveryStatusLine ? (
              <div className="mt-4 rounded-md border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm leading-6 text-[var(--app-text)]">
                <p>{deliveryStatusLine}</p>
                {lastDeliveryDigestSlug ? (
                  <a
                    className="mt-2 inline-block text-[var(--spotify-green)] underline-offset-2 hover:underline"
                    href={`/digest/${lastDeliveryDigestSlug}`}
                  >
                    Open last episode
                  </a>
                ) : null}
              </div>
            ) : null}
            <p className="mt-2 text-xs text-[var(--app-text-muted)]">
              On Vercel, cron runs every 10 minutes via vercel.json. Set CRON_SECRET (same as PIPELINE_CRON_SECRET).
            </p>
            <label className="mt-4 flex items-center gap-3 text-sm text-[var(--app-text)]">
              <input
                checked={deliveryWeekdaysOnly}
                className="h-4 w-4 rounded accent-[var(--spotify-green)]"
                onChange={(event) => setDeliveryWeekdaysOnly(event.target.checked)}
                type="checkbox"
              />
              Weekdays only (no weekend reminders)
            </label>
          </div>

          <div className="mt-6 space-y-4">
            {notifications.map((item) => (
              <div key={item.channelType} className="rounded-md bg-[var(--spotify-elevated)] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-[var(--app-text)]">{item.label}</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">{item.helperText}</p>
                  </div>

                  <button
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      item.isEnabled ? "bg-[var(--accent-primary)] text-[var(--accent-on-primary)]" : "bg-[var(--app-chip-bg)] text-[var(--app-text-muted)]"
                    }`}
                    onClick={() => toggleNotification(item.channelType)}
                    type="button"
                  >
                    {item.isEnabled ? "Enabled" : "Disabled"}
                  </button>
                </div>

                {item.channelType === "telegram" ? (
                  <input
                    className="mt-4 w-full rounded-md border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)] outline-none placeholder:text-[var(--app-text-muted)] focus:ring-2 focus:ring-[var(--accent-primary)]"
                    onChange={(event) => updateNotificationTarget(item.channelType, event.target.value)}
                    placeholder="@your_telegram_handle or chat id"
                    type="text"
                    value={item.targetValue ?? ""}
                  />
                ) : (
                  <div className="mt-4 rounded-md bg-[var(--app-surface-elevated)] px-3 py-3 text-sm leading-6">
                    <p className="text-xs font-medium text-[var(--app-text-muted)]">Podcast RSS</p>
                    <p className="mt-2 text-xs text-[var(--app-text-muted)]">Private link (token — preferred for players)</p>
                    <p className="mt-1 break-all text-[var(--spotify-green)]">{displayRssUrl}</p>
                    <p className="mt-3 text-xs text-[var(--app-text-muted)]">Feed by account ID (dynamic API)</p>
                    <p className="mt-1 break-all font-mono text-[13px] text-[var(--app-text)]">
                      {userApiRssUrl ?? "Available after sign-in and loading settings from the server."}
                    </p>
                    <p className="mt-3 text-xs text-[var(--app-text-muted)]">
                      Public guest link: <span className="break-all text-[var(--app-text-muted)]">{rssUrl}</span>. Personal URLs below are enabled after sign-in and clicking Save preferences.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="spotify-panel p-5">
          <h2 className="text-lg font-bold text-[var(--app-text)]">Generate now</h2>
          <p className="mt-1 text-sm text-[var(--app-text-muted)]">One-off episode from your queue or a single thread.</p>

          <label className="mt-5 block text-xs font-medium text-[var(--app-text-muted)]" htmlFor="reddit-thread-url">
            Optional Reddit thread URL or post id
          </label>
          <input
            className="mt-2 w-full rounded-md border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2.5 text-sm text-[var(--app-text)] outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
            id="reddit-thread-url"
            onChange={(event) => setRedditPostReference(event.target.value)}
            placeholder="https://www.reddit.com/r/productivity/comments/..."
            value={redditPostReference}
          />

          <label className="mt-4 block text-xs font-medium text-[var(--app-text-muted)]" htmlFor="episode-mode">
            Episode mode
          </label>
          <select
            className="mt-2 w-full rounded-md border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2.5 text-sm text-[var(--app-text)] outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
            disabled={Boolean(redditPostReference.trim())}
            id="episode-mode"
            onChange={(event) => setEpisodeMode(event.target.value as "multi" | "single_thread")}
            value={redditPostReference.trim() ? "single_thread" : episodeMode}
          >
            <option value="multi">Multi-thread daily mix (up to 3 threads)</option>
            <option value="single_thread">Single-thread episode (~5 min focus)</option>
          </select>

          <label className="mt-5 flex items-center gap-3 text-sm text-[var(--app-text-muted)]">
            <input
              checked={queueInBackground}
              className="h-4 w-4 rounded accent-[var(--spotify-green)]"
              onChange={(event) => setQueueInBackground(event.target.checked)}
              type="checkbox"
            />
            Queue in background (recommended for long runs)
          </label>
        </section>

        <section className="spotify-panel sticky bottom-4 z-20 border-[var(--accent-primary)]/20 p-5 shadow-2xl xl:static xl:shadow-none">
          <p className="text-sm leading-6 text-[var(--app-text-muted)]" role="status">
            {status}
          </p>

          <div className="mt-5 flex flex-col gap-2">
            <button
              className="inline-flex w-full justify-center rounded-full bg-[var(--accent-primary)] px-5 py-3 text-sm font-bold text-[var(--accent-on-primary)] transition hover:scale-[1.02] hover:bg-[var(--accent-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSaving}
              onClick={() => {
                void handleSave();
              }}
              type="button"
            >
              {isSaving ? "Saving…" : "Save preferences"}
            </button>
            <button
              className="inline-flex w-full justify-center rounded-full border border-[var(--app-border)] bg-transparent px-5 py-3 text-sm font-bold text-[var(--app-text)] transition hover:border-[var(--accent-primary)]/40 hover:bg-[var(--app-chip-bg)] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={onDemandBusy || isSaving || (subreddits.length === 0 && !redditPostReference.trim())}
              onClick={() => {
                void handleOnDemandDigest();
              }}
              title={
                subreddits.length === 0
                  ? "Select subreddits first"
                  : "Builds a fresh digest now (may take several minutes)"
              }
              type="button"
            >
              {onDemandBusy ? "Generating…" : "Generate on demand"}
            </button>
            {hasTelegramEnabled ? (
              <p className="rounded-md border border-[var(--app-border)] bg-[var(--app-surface-elevated)] px-3 py-2 text-xs text-[var(--app-text-muted)]">
                Telegram enabled — set TELEGRAM_BOT_TOKEN on the server and your chat id above; cron calls /api/delivery/process-due.
              </p>
            ) : null}
          </div>
          <p className="mt-3 text-xs leading-5 text-[var(--app-text-muted)]">
            On-demand uses subreddits, voice, and depth saved in Supabase (click Save if you have not yet).
            On hosts with short timeouts the request may fail — check server logs or run the pipeline from the CLI.
          </p>
          {onDemandMessage ? (
            <p className="mt-3 rounded-md border border-[var(--app-border)] bg-[var(--app-surface-elevated)] px-3 py-3 text-sm text-[var(--app-text)]">
              {onDemandMessage}
            </p>
          ) : null}
        </section>
      </aside>
    </div>
    </>
  );
}
