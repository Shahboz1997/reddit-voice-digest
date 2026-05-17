"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";

import { ArchiveSidebar } from "@/components/archive-sidebar";
import { AuthHeader } from "@/components/auth-header";
import { AudioPlayer } from "@/components/audio-player";
import { BrandMark } from "@/components/brand-mark";
import { KeyThoughtsPanel } from "@/components/key-thoughts-panel";
import { LiveOnAirBadge } from "@/components/live-on-air-badge";
import { defaultSubredditPreferences } from "@/lib/catalog";
import { formatDigestDate } from "@/lib/date";
import type { DigestEpisode } from "@/lib/types";

interface DashboardClientProps {
  episodes: DigestEpisode[];
  rssUrl: string;
}

const preferencesStorageKey = "reddit-voice-digest.preferences";

let cachedRaw: string | null | undefined;
let cachedSubreddits: readonly string[] = defaultSubredditPreferences;

function readStoredSubreddits(): readonly string[] {
  try {
    const raw = window.localStorage.getItem(preferencesStorageKey);

    if (raw === cachedRaw) {
      return cachedSubreddits;
    }

    cachedRaw = raw;

    if (!raw) {
      cachedSubreddits = defaultSubredditPreferences;
      return cachedSubreddits;
    }

    const parsed = JSON.parse(raw) as { subreddits?: string[] };

    if (parsed.subreddits?.length) {
      cachedSubreddits = parsed.subreddits;
      return cachedSubreddits;
    }
  } catch {
    // If local storage is missing or malformed, the dashboard falls back to defaults.
  }

  cachedSubreddits = defaultSubredditPreferences;
  return cachedSubreddits;
}

function subscribeToSubredditPreferences(onStoreChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === preferencesStorageKey || event.key === null) {
      cachedRaw = undefined;
      onStoreChange();
    }
  };

  window.addEventListener("storage", handleStorage);
  return () => window.removeEventListener("storage", handleStorage);
}

export function DashboardClient({ episodes, rssUrl }: DashboardClientProps) {
  const latestEpisode = episodes[0];
  const selectedSubreddits = useSyncExternalStore(
    subscribeToSubredditPreferences,
    readStoredSubreddits,
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

  const [isPlaying, setIsPlaying] = useState(false);

  const headlineDate = formatDigestDate(latestEpisode.publishedAt, {
    day: "numeric",
    month: "long",
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-10 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <LiveOnAirBadge active={isPlaying} />

      <header className="radio-glass flex flex-col gap-5 rounded-2xl p-5 md:flex-row md:items-center md:justify-between" id="about">
        <BrandMark />

        <div className="flex flex-wrap items-center gap-3">
          <AuthHeader />
          <Link
            className="inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2 font-display text-xs font-bold uppercase tracking-wider text-white transition hover:border-[var(--radio-pink)]/50 hover:text-[var(--radio-pink)]"
            href="/settings"
          >
            My lineup
          </Link>
        </div>
      </header>

      <section className="w-full space-y-6" id="player">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-4xl">
            <p className="font-display text-[10px] font-bold uppercase tracking-[0.45em] text-[var(--radio-yellow)]">
              On air now
            </p>
            <h1 className="mt-3 font-display text-3xl font-black uppercase leading-[1.05] tracking-wide text-white sm:text-4xl lg:text-5xl">
              Main Reddit stories
              <span className="mt-1 block text-white/55">for {headlineDate}</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/50 sm:text-base">{latestEpisode.summary}</p>
          </div>

          <div className="flex max-w-md flex-wrap gap-2">
            {selectedSubreddits.map((subreddit) => (
              <span
                key={subreddit}
                className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-wider text-white/70"
              >
                r/{subreddit}
              </span>
            ))}
          </div>
        </div>

        <AudioPlayer
          audioUrl={latestEpisode.audioUrl}
          chapters={latestEpisode.chapters}
          durationSeconds={latestEpisode.durationSeconds}
          nowPlayingTitle={latestEpisode.title}
          onPlaybackChange={setIsPlaying}
          playlistItems={latestEpisode.items}
          variant="radio"
        />

        <div className="flex flex-wrap gap-2">
          {(personalizedTopics.length ? personalizedTopics : latestEpisode.topics).map((topic) => (
            <span
              key={topic}
              className="rounded-md border border-[var(--radio-pink)]/25 bg-[var(--radio-pink)]/10 px-3 py-1 font-display text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--radio-pink)]"
            >
              #{topic}
            </span>
          ))}
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1fr_340px]" id="archive">
        <KeyThoughtsPanel episode={latestEpisode} variant="radio" />
        <ArchiveSidebar episodes={episodes} rssUrl={rssUrl} variant="radio" />
      </section>
    </main>
  );
}
