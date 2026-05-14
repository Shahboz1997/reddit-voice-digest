"use client";

import { useEffect, useMemo, useState } from "react";

import type { NotificationPreference, SourceSeed } from "@/lib/types";

interface SettingsFormProps {
  availableSources: SourceSeed[];
  defaultSubreddits: string[];
  defaultNotifications: NotificationPreference[];
  rssUrl: string;
}

const preferencesStorageKey = "reddit-voice-digest.preferences";

export function SettingsForm({
  availableSources,
  defaultSubreddits,
  defaultNotifications,
  rssUrl,
}: SettingsFormProps) {
  const [subreddits, setSubreddits] = useState<string[]>(defaultSubreddits);
  const [notifications, setNotifications] = useState<NotificationPreference[]>(defaultNotifications);
  const [status, setStatus] = useState("Changes will save locally until Supabase Auth is connected.");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadPreferences() {
      try {
        const response = await fetch("/api/preferences", { cache: "no-store" });

        if (response.ok) {
          const payload = (await response.json()) as {
            subreddits?: string[];
            notifications?: NotificationPreference[];
            source?: string;
          };

          if (!ignore) {
            if (payload.subreddits?.length) {
              setSubreddits(payload.subreddits);
            }

            if (payload.notifications?.length) {
              setNotifications(payload.notifications);
            }

            if (payload.source === "remote") {
              setStatus("Preferences loaded from Supabase.");
            }
          }
        }
      } catch {
        try {
          const raw = window.localStorage.getItem(preferencesStorageKey);

          if (!raw) {
            return;
          }

          const parsed = JSON.parse(raw) as {
            subreddits?: string[];
            notifications?: NotificationPreference[];
          };

          if (!ignore) {
            if (parsed.subreddits?.length) {
              setSubreddits(parsed.subreddits);
            }

            if (parsed.notifications?.length) {
              setNotifications(parsed.notifications);
            }
          }
        } catch {
          // Ignore malformed local storage and use defaults.
        }
      }
    }

    void loadPreferences();

    return () => {
      ignore = true;
    };
  }, []);

  const hasTelegramEnabled = useMemo(() => {
    return notifications.some((item) => item.channelType === "telegram" && item.isEnabled);
  }, [notifications]);

  function toggleSubreddit(name: string) {
    setSubreddits((current) =>
      current.includes(name) ? current.filter((item) => item !== name) : [...current, name],
    );
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

  async function handleSave() {
    setIsSaving(true);

    const payload = {
      subreddits,
      notifications,
    };

    window.localStorage.setItem(preferencesStorageKey, JSON.stringify(payload));

    try {
      const response = await fetch("/api/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setStatus("Preferences saved to Supabase and local storage.");
      } else if (response.status === 401) {
        setStatus("Saved locally. Sign in with Supabase Auth later to persist preferences in the database.");
      } else {
        setStatus("Saved locally. Remote persistence is not active yet.");
      }
    } catch {
      setStatus("Saved locally. Remote persistence will work once the backend is configured.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[1.3fr_0.9fr]">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
        <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Personalization</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Configure my subreddits</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
          Choose the communities that should shape your personal digest. The current UI saves
          instantly to local storage and is ready to persist to Supabase once Auth is active.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {availableSources.map((source) => {
            const selected = subreddits.includes(source.subreddit_name);

            return (
              <button
                key={source.subreddit_name}
                className={`rounded-3xl border px-4 py-4 text-left transition ${
                  selected
                    ? "border-cyan-400/40 bg-cyan-400/10"
                    : "border-white/10 bg-slate-950/60 hover:border-white/20 hover:bg-white/10"
                }`}
                onClick={() => toggleSubreddit(source.subreddit_name)}
                type="button"
              >
                <p className="text-sm font-medium text-white">r/{source.subreddit_name}</p>
                <p className="mt-2 text-sm text-slate-300">Priority score: {source.priority}</p>
              </button>
            );
          })}
        </div>
      </section>

      <div className="space-y-6">
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Delivery</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Notifications and feeds</h2>

          <div className="mt-5 space-y-4">
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
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-cyan-100">
                    {rssUrl}
                  </div>
                )}
              </div>
            ))}
          </div>
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
            {hasTelegramEnabled ? (
              <p className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
                Telegram delivery will activate when the bot token is added.
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
