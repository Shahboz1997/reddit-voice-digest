"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";

import { ArchiveSidebar } from "@/components/archive-sidebar";
import { AudioPlayer } from "@/components/audio-player";
import { BrandMark } from "@/components/brand-mark";
import { KeyThoughtsPanel } from "@/components/key-thoughts-panel";
import { defaultSubredditPreferences } from "@/lib/catalog";
import { formatDigestDate } from "@/lib/date";
import type { DigestEpisode } from "@/lib/types";

interface DashboardClientProps {
  episodes: DigestEpisode[];
  rssUrl: string;
}

const preferencesStorageKey = "reddit-voice-digest.preferences";

function subscribeToSubredditPreferences() {
  return () => undefined;
}

function getStoredSubreddits() {
  try {
    const raw = window.localStorage.getItem(preferencesStorageKey);

    if (!raw) {
      return defaultSubredditPreferences;
    }

    const parsed = JSON.parse(raw) as { subreddits?: string[] };

    if (parsed.subreddits?.length) {
      return parsed.subreddits;
    }
  } catch {
    // If local storage is missing or malformed, the dashboard falls back to defaults.
  }

  return defaultSubredditPreferences;
}

export function DashboardClient({ episodes, rssUrl }: DashboardClientProps) {
  const latestEpisode = episodes[0];
  const selectedSubreddits = useSyncExternalStore(
    subscribeToSubredditPreferences,
    getStoredSubreddits,
    () => defaultSubredditPreferences,
  );

  const personalizedTopics = useMemo(() => {
    return latestEpisode.topics.filter(
      (topic) =>
        selectedSubreddits.includes(topic) ||
        selectedSubreddits.includes(topic.toLowerCase()) ||
        topic === "finance",
    );
  }, [latestEpisode.topics, selectedSubreddits]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-5 rounded-[2rem] border border-white/10 bg-white/5 px-6 py-5 backdrop-blur md:flex-row md:items-center md:justify-between">
        <BrandMark />

        <div className="flex flex-wrap items-center gap-3">
          <Link
            className="inline-flex rounded-full border border-white/10 bg-slate-950/60 px-4 py-2 text-sm text-white transition hover:border-cyan-300/30 hover:text-cyan-200"
            href="/settings"
          >
            Configure my subreddits
          </Link>
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-slate-950/60 px-4 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-400 text-sm font-semibold text-slate-950">
              RV
            </div>
            <div>
              <p className="text-sm font-medium text-white">Demo profile</p>
              <p className="text-xs text-slate-400">Supabase Auth ready</p>
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-8 xl:grid-cols-[1.75fr_0.95fr]">
        <div className="space-y-8">
          <section className="rounded-[2.25rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm uppercase tracking-[0.28em] text-cyan-300">
                  Main podcast of the day
                </p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  Main Reddit stories for{" "}
                  {formatDigestDate(latestEpisode.publishedAt, {
                    day: "numeric",
                    month: "long",
                  })}
                </h1>
                <p className="mt-4 text-base leading-7 text-slate-300">{latestEpisode.summary}</p>
              </div>

              <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-4">
                <p className="text-sm font-medium text-cyan-50">My subreddits</p>
                <div className="mt-3 flex max-w-xs flex-wrap gap-2">
                  {selectedSubreddits.map((subreddit) => (
                    <span
                      key={subreddit}
                      className="rounded-full border border-cyan-300/20 bg-slate-950/60 px-3 py-1 text-xs text-cyan-100"
                    >
                      r/{subreddit}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-[2rem] border border-white/10 bg-slate-950/60 p-6">
              <AudioPlayer
                audioUrl={latestEpisode.audioUrl}
                chapters={latestEpisode.chapters}
                durationSeconds={latestEpisode.durationSeconds}
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {(personalizedTopics.length ? personalizedTopics : latestEpisode.topics).map((topic) => (
                <span
                  key={topic}
                  className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-cyan-100"
                >
                  #{topic}
                </span>
              ))}
            </div>
          </section>

          <KeyThoughtsPanel episode={latestEpisode} />
        </div>

        <ArchiveSidebar episodes={episodes} rssUrl={rssUrl} />
      </section>
    </main>
  );
}
