"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";

import { ArchiveSidebar } from "@/components/archive-sidebar";
import { AudioPlayer } from "@/components/audio-player";
import { BroadcastPlaylist } from "@/components/broadcast-playlist";
import { EpisodeCoverArt } from "@/components/subreddit-art";
import { InsightDrawer } from "@/components/insight-drawer";
import { PlayerShell } from "@/components/player-shell";
import { ThreadDetailDrawer } from "@/components/thread-detail-drawer";
import { defaultSubredditPreferences } from "@/lib/catalog";
import { formatDigestDate } from "@/lib/date";
import { IconDocument, IconList, IconSettings } from "@/lib/ui-icons";
import type { DigestChapter, DigestEpisode, DigestItem } from "@/lib/types";

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
    // fall through
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
  const hasEpisodes = episodes.length > 0;
  const selectedSubreddits = useSyncExternalStore(
    subscribeToSubredditPreferences,
    readStoredSubreddits,
    () => defaultSubredditPreferences,
  );

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeChapter, setActiveChapter] = useState<DigestChapter | undefined>();
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [threadDetail, setThreadDetail] = useState<DigestItem | null>(null);
  const [seekRequest, setSeekRequest] = useState<{ seconds: number; token: number } | undefined>();

  const headlineDate = latestEpisode
    ? formatDigestDate(latestEpisode.publishedAt, { day: "numeric", month: "short" })
    : null;

  const personalizedTopics = useMemo(() => {
    if (!latestEpisode) {
      return [];
    }

    return latestEpisode.topics.filter(
      (topic) =>
        selectedSubreddits.includes(topic) ||
        selectedSubreddits.includes(topic.toLowerCase()) ||
        topic === "finance",
    );
  }, [latestEpisode, selectedSubreddits]);

  const player = hasEpisodes && latestEpisode ? (
    <AudioPlayer
      audioUrl={latestEpisode.audioUrl}
      chapters={latestEpisode.chapters}
      durationSeconds={latestEpisode.durationSeconds}
      nowPlayingTitle={latestEpisode.title}
      onPlaybackChange={setIsPlaying}
      onTimeUpdate={(time, chapter) => {
        setCurrentTime(time);
        setActiveChapter(chapter);
      }}
      playlistItems={latestEpisode.items}
      seekRequest={seekRequest}
      variant="spotify"
    />
  ) : null;

  return (
    <PlayerShell isPlaying={isPlaying} player={player} rssUrl={rssUrl}>
      {!hasEpisodes ? (
        <div className="radio-glass flex min-h-[50vh] flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 p-10 text-center">
          <p className="font-display text-[10px] font-bold uppercase tracking-[0.45em] text-[var(--radio-yellow)]">
            Offline
          </p>
          <h1 className="mt-4 font-display text-3xl font-black uppercase tracking-wide text-white">No episodes</h1>
          <Link
            className="mt-8 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--radio-pink)]/20 text-[var(--radio-pink)] ring-1 ring-[var(--radio-pink)]/40"
            href="/settings"
            title="Settings"
          >
            <IconSettings className="h-5 w-5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <section className="flex flex-col gap-6 lg:flex-row lg:items-start" id="player">
            <div className="radio-glass flex flex-1 flex-col items-center justify-center rounded-2xl px-6 py-8">
              <div className="mb-4 flex w-full items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-[var(--radio-pink)]/15 px-3 py-1 font-display text-[10px] font-bold uppercase tracking-widest text-[var(--radio-pink)] ring-1 ring-[var(--radio-pink)]/30">
                  <span className="live-dot live-dot--pulse" />
                  {headlineDate ?? "Today"}
                </span>
                <div className="flex gap-1">
                  <button
                    aria-label="Open TL;DR"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/50 transition hover:border-[var(--radio-pink)]/40 hover:text-[var(--radio-pink)]"
                    onClick={() => setInsightsOpen(true)}
                    title="TL;DR"
                    type="button"
                  >
                    <IconDocument className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <EpisodeCoverArt title={latestEpisode.title} topics={latestEpisode.topics} />
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {(personalizedTopics.length ? personalizedTopics : latestEpisode.topics).map((topic) => (
                  <span
                    key={topic}
                    className="rounded-md border border-[var(--radio-pink)]/25 bg-[var(--radio-pink)]/10 px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-wider text-[var(--radio-pink)]"
                    title={topic}
                  >
                    #{topic}
                  </span>
                ))}
              </div>
            </div>

            <div className="radio-glass min-h-[320px] w-full rounded-2xl p-4 lg:max-w-md xl:max-w-lg">
              <BroadcastPlaylist
                activeChapterId={activeChapter?.id}
                chapters={latestEpisode.chapters}
                currentTime={currentTime}
                isPlaying={isPlaying}
                items={latestEpisode.items}
                onItemInfo={setThreadDetail}
                onSelect={(seconds) => {
                  setSeekRequest({ seconds, token: Date.now() });
                }}
                variant="spotify"
              />
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_300px]" id="archive">
            <div className="radio-glass rounded-2xl p-4">
              <div className="mb-3 flex items-center gap-2">
                <IconList className="h-5 w-5 text-[var(--radio-yellow)]" />
                <span className="font-display text-xs font-bold uppercase tracking-wider text-white/70">Stations</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedSubreddits.map((subreddit) => (
                  <span
                    key={subreddit}
                    className="rounded-md border border-white/10 bg-white/5 px-2 py-1 font-display text-[10px] font-bold uppercase tracking-wider text-white/70"
                    title={`r/${subreddit}`}
                  >
                    r/{subreddit}
                  </span>
                ))}
              </div>
            </div>
            <ArchiveSidebar episodes={episodes} rssUrl={rssUrl} variant="spotify" />
          </section>
        </div>
      )}

      {latestEpisode ? (
        <>
          <InsightDrawer episode={latestEpisode} onClose={() => setInsightsOpen(false)} open={insightsOpen} />
          <ThreadDetailDrawer item={threadDetail} onClose={() => setThreadDetail(null)} />
        </>
      ) : null}
    </PlayerShell>
  );
}
