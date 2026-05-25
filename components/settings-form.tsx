"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  defaultElevenLabsVoiceIdForPersona,
  ELEVENLABS_VOICE_CATALOG,
  isKnownElevenLabsVoiceId,
  PERSONAS,
  SUMMARY_DEPTHS,
} from "@/lib/digest-persona";
import { SubredditStationGrid } from "@/components/subreddit-station-grid";
import { COMMON_TIMEZONES } from "@/lib/delivery/timezone-options";
import { getSubredditStation } from "@/lib/subreddit-stations";
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

  const persistLocalSnapshot = useCallback(() => {
    const snapshot: LocalPreferences = {
      subreddits,
      notifications,
      persona,
      summaryDepth,
      deliveryLocalTime: deliveryLocalTime || null,
      deliveryWeekdaysOnly,
      timezone,
      elevenlabsVoiceId,
    };
    window.localStorage.setItem(preferencesStorageKey, JSON.stringify(snapshot));
  }, [
    deliveryLocalTime,
    deliveryWeekdaysOnly,
    timezone,
    elevenlabsVoiceId,
    notifications,
    persona,
    subreddits,
    summaryDepth,
  ]);

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
    return [...availableSources].sort((a, b) => a.subreddit_name.localeCompare(b.subreddit_name));
  }, [availableSources]);

  const personaDefaultVoiceId = useMemo(
    () => defaultElevenLabsVoiceIdForPersona(persona),
    [persona],
  );

  const customVoiceActive =
    Boolean(elevenlabsVoiceId) && !isKnownElevenLabsVoiceId(elevenlabsVoiceId ?? "");

  function addSubreddit(name: string) {
    setSubreddits((current) => (current.includes(name) ? current : [...current, name]));
  }

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
        setStatus("Saved to Supabase and locally.");
        void loadDeliveryStatus();
      } else if (response.status === 401) {
        setStatus(
          "Saved locally. After signing in with Supabase, sync will push your profile to the server and issue a personal RSS feed.",
        );
      } else {
        setStatus("Saved locally. Remote settings returned an error.");
      }
    } catch {
      setStatus("Saved locally. Check your network and try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[1.3fr_0.9fr]">
      <section className="radio-glass rounded-2xl p-6">
        <p className="font-display text-sm font-bold uppercase tracking-[0.28em] text-[var(--radio-pink)]">
          Personalization
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold uppercase tracking-tight text-white">
          Communities & priority
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
          Tap a subreddit tile to select it. Drag selected items below to set podcast priority — higher in the list means higher priority. Voice, summary depth, and more are below.
        </p>

        <div className="mt-6 border-b border-white/10 pb-6">
          <p className="font-display text-xs font-bold uppercase tracking-[0.28em] text-white/50">Stations</p>
          <p className="mt-1 text-sm text-white/55">
            Radio Record–style tiles — tap to add or remove a subreddit.
          </p>
          <div className="mt-4">
            <SubredditStationGrid
              onToggle={toggleSubreddit}
              selected={subreddits}
              sources={catalogSorted}
            />
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Priority (drag & drop)</p>
          {subreddits.length === 0 ? (
            <p className="text-sm text-slate-400">Add at least one subreddit above.</p>
          ) : (
            subreddits.map((name, index) => {
              const { Icon, label } = getSubredditStation(name);

              return (
                <div
                  key={name}
                  className="flex cursor-grab items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#181818] px-4 py-3 active:cursor-grabbing"
                  draggable
                  onDragEnd={() => setDragIndex(null)}
                  onDragOver={(event) => {
                    event.preventDefault();
                  }}
                  onDragStart={() => setDragIndex(index)}
                  onDrop={() => {
                    if (dragIndex === null || dragIndex === index) return;
                    moveSubreddit(dragIndex, index);
                    setDragIndex(null);
                  }}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0d0d0d]">
                      <Icon className="h-5 w-5 text-white/80" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--radio-pink)]">
                        #{index + 1}
                      </p>
                      <p className="mt-0.5 truncate font-display text-sm font-bold uppercase text-white">
                        {label}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-white/45">
                        r/{name} · score {availableSources.find((s) => s.subreddit_name === name)?.priority ?? "—"}
                      </p>
                    </div>
                  </div>
                  <button
                    className="shrink-0 rounded-full border border-white/10 px-3 py-1 text-xs text-white/70 hover:border-[var(--radio-pink)]/40 hover:text-white"
                    onClick={() => removeSubreddit(name)}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-slate-950/60 p-5">
          <p className="text-sm uppercase tracking-[0.22em] text-cyan-300">Voice & vibe</p>
          <div className="mt-4 space-y-3">
            {PERSONAS.map((row) => (
              <label
                key={row.id}
                className={`flex cursor-pointer flex-col rounded-2xl border px-4 py-3 text-left transition ${
                  persona === row.id ? "border-cyan-400/50 bg-white/10" : "border-white/10 hover:border-white/20"
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
                    <span className="text-sm font-medium text-white">{row.label}</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-400">{row.hint}</span>
                    <span className="mt-1 block text-[11px] text-slate-500">
                      Changes OpenAI instructions for summary/script and TTS voice (ElevenLabs or OpenAI — see AUDIO_PROVIDER).
                    </span>
                  </span>
                </span>
              </label>
            ))}
          </div>

          <div className="mt-8 border-t border-white/10 pt-6">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">ElevenLabs voice</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              When AUDIO_PROVIDER=elevenlabs, controls narration. Auto picks a voice for your persona (currently:{" "}
              {ELEVENLABS_VOICE_CATALOG.find((v) => v.id === personaDefaultVoiceId)?.name ?? "—"}).
            </p>

            <div className="mt-4 space-y-2">
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition ${
                  !elevenlabsVoiceId && !customVoiceActive
                    ? "border-cyan-400/50 bg-white/10"
                    : "border-white/10 hover:border-white/20"
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
                  <span className="text-sm font-medium text-white">Auto (by persona)</span>
                  <span className="mt-1 block text-xs text-slate-400">
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
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition ${
                      selected ? "border-cyan-400/50 bg-white/10" : "border-white/10 hover:border-white/20"
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
                        <span className="text-sm font-medium text-white">{voice.name}</span>
                        {recommended ? (
                          <span className="rounded-full bg-cyan-400/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-cyan-200">
                            for persona
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-slate-400">{voice.hint}</span>
                    </span>
                  </label>
                );
              })}

              <label
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition ${
                  customVoiceActive || showCustomVoice
                    ? "border-cyan-400/50 bg-white/10"
                    : "border-white/10 hover:border-white/20"
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
                  <span className="text-sm font-medium text-white">Custom voice ID</span>
                  <span className="mt-1 block text-xs text-slate-400">
                    From ElevenLabs → Voices → copy a clone or premade voice ID.
                  </span>
                  {showCustomVoice || customVoiceActive ? (
                    <input
                      className="mt-3 w-full rounded-xl border border-white/15 bg-slate-950/80 px-3 py-2 font-mono text-xs text-white placeholder:text-slate-600"
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

          <p className="mt-8 text-xs uppercase tracking-[0.22em] text-slate-400">Summary depth</p>
          <div className="mt-4">
            <input
              className="w-full accent-cyan-400"
              max={SUMMARY_DEPTHS.length - 1}
              min={0}
              onChange={(e) => setSummaryDepth(SUMMARY_DEPTHS[Number(e.target.value)].id)}
              step={1}
              type="range"
              value={depthIndex(summaryDepth)}
            />
            <div className="mt-2 flex justify-between gap-3 text-[11px] text-slate-400">
              {SUMMARY_DEPTHS.map((row) => (
                <span
                  key={row.id}
                  className={summaryDepth === row.id ? "text-cyan-200" : undefined}
                  style={{ flex: "1 1 0" }}
                >
                  {row.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-6">
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Delivery</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Notifications & feeds</h2>

          <div className="mt-6 rounded-3xl border border-white/15 bg-slate-950/50 p-4">
            <p className="text-sm font-medium text-white">Scheduled delivery</p>
            <p className="mt-2 text-sm text-slate-400">
              When you enable a channel below and connect a worker/cron to these fields, the digest can be delivered daily at your chosen time.
            </p>
            <label className="mt-4 block text-xs uppercase tracking-[0.2em] text-slate-500" htmlFor="delivery-time">
              Local time
            </label>
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-2 text-sm text-white outline-none focus:border-cyan-300/40"
              id="delivery-time"
              onChange={(event) => setDeliveryLocalTime(event.target.value)}
              type="time"
              value={deliveryLocalTime}
            />
            <label className="mt-4 block text-xs uppercase tracking-[0.2em] text-slate-500" htmlFor="delivery-timezone">
              Timezone
            </label>
            <select
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-2 text-sm text-white outline-none focus:border-cyan-300/40"
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
              <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 px-4 py-3 text-sm leading-6 text-slate-200">
                <p>{deliveryStatusLine}</p>
                {lastDeliveryDigestSlug ? (
                  <a
                    className="mt-2 inline-block text-cyan-300 underline-offset-2 hover:underline"
                    href={`/digest/${lastDeliveryDigestSlug}`}
                  >
                    Open last episode
                  </a>
                ) : null}
              </div>
            ) : null}
            <p className="mt-2 text-xs text-slate-500">
              On Vercel, cron runs every 10 minutes via vercel.json. Set CRON_SECRET (same as PIPELINE_CRON_SECRET).
            </p>
            <label className="mt-4 flex items-center gap-3 text-sm text-slate-200">
              <input
                checked={deliveryWeekdaysOnly}
                className="h-4 w-4 rounded accent-cyan-400"
                onChange={(event) => setDeliveryWeekdaysOnly(event.target.checked)}
                type="checkbox"
              />
              Weekdays only (no weekend reminders)
            </label>
          </div>

          <div className="mt-6 space-y-4">
            {notifications.map((item) => (
              <div key={item.channelType} className="rounded-3xl border border-white/10 bg-slate-950/60 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{item.helperText}</p>
                  </div>

                  <button
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      item.isEnabled ? "bg-cyan-400 text-slate-950" : "bg-white/10 text-slate-300"
                    }`}
                    onClick={() => toggleNotification(item.channelType)}
                    type="button"
                  >
                    {item.isEnabled ? "Enabled" : "Disabled"}
                  </button>
                </div>

                {item.channelType === "telegram" ? (
                  <input
                    className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/40"
                    onChange={(event) => updateNotificationTarget(item.channelType, event.target.value)}
                    placeholder="@your_telegram_handle or chat id"
                    type="text"
                    value={item.targetValue ?? ""}
                  />
                ) : (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Podcast RSS</p>
                    <p className="mt-2 text-xs text-slate-500">Private link (token — preferred for players)</p>
                    <p className="mt-1 break-all text-cyan-100">{displayRssUrl}</p>
                    <p className="mt-3 text-xs text-slate-500">Feed by account ID (dynamic API)</p>
                    <p className="mt-1 break-all font-mono text-[13px] text-cyan-200/90">
                      {userApiRssUrl ?? "Available after sign-in and loading settings from the server."}
                    </p>
                    <p className="mt-3 text-xs text-slate-500">
                      Public guest link: <span className="break-all text-slate-400">{rssUrl}</span>. Personal URLs below are enabled after sign-in and clicking Save preferences.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Generation</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">On-demand digest</h2>

          <label className="mt-6 block text-xs uppercase tracking-[0.2em] text-slate-500" htmlFor="reddit-thread-url">
            Optional Reddit thread URL or post id
          </label>
          <input
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/40"
            id="reddit-thread-url"
            onChange={(event) => setRedditPostReference(event.target.value)}
            placeholder="https://www.reddit.com/r/productivity/comments/..."
            value={redditPostReference}
          />

          <label className="mt-5 block text-xs uppercase tracking-[0.2em] text-slate-500" htmlFor="episode-mode">
            Episode mode
          </label>
          <select
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/40"
            disabled={Boolean(redditPostReference.trim())}
            id="episode-mode"
            onChange={(event) => setEpisodeMode(event.target.value as "multi" | "single_thread")}
            value={redditPostReference.trim() ? "single_thread" : episodeMode}
          >
            <option value="multi">Multi-thread daily mix (up to 3 threads)</option>
            <option value="single_thread">Single-thread episode (~5 min focus)</option>
          </select>

          <label className="mt-5 flex items-center gap-3 text-sm text-slate-300">
            <input
              checked={queueInBackground}
              className="h-4 w-4 rounded border-white/20 bg-slate-900 accent-cyan-400"
              onChange={(event) => setQueueInBackground(event.target.checked)}
              type="checkbox"
            />
            Queue in background (recommended for long runs)
          </label>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Status</p>
          <p className="mt-3 text-sm leading-7 text-slate-300">{status}</p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              className="inline-flex rounded-full bg-cyan-400 px-5 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSaving}
              onClick={() => {
                void handleSave();
              }}
              type="button"
            >
              {isSaving ? "Saving..." : "Save preferences"}
            </button>
            <button
              className="inline-flex rounded-full border border-amber-400/50 bg-amber-400/10 px-5 py-2 text-sm font-medium text-amber-100 transition hover:border-amber-300/80 hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-50"
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
              <p className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
                Telegram enabled — set TELEGRAM_BOT_TOKEN on the server and your chat id above; cron calls /api/delivery/process-due.
              </p>
            ) : null}
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            On-demand uses subreddits, voice, and depth saved in Supabase (click Save if you have not yet).
            On hosts with short timeouts the request may fail — check server logs or run the pipeline from the CLI.
          </p>
          {onDemandMessage ? (
            <p className="mt-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-200">
              {onDemandMessage}
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}
