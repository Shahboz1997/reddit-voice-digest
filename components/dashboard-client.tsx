"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";

import { ArchiveSidebar } from "@/components/archive-sidebar";
import { AudioPlayer } from "@/components/audio-player";
import { BroadcastPlaylist } from "@/components/broadcast-playlist";
import { ContinueListeningBanner } from "@/components/continue-listening-banner";
import { EpisodeCoverArt } from "@/components/subreddit-art";
import { InsightDrawer } from "@/components/insight-drawer";
import { PlayerShell } from "@/components/player-shell";
import { ThreadDetailDrawer } from "@/components/thread-detail-drawer";
import { defaultSubredditPreferences } from "@/lib/catalog";
import { formatDigestDate } from "@/lib/date";
import { requestExpandPlayer } from "@/lib/player-events";
import { useMediaQuery } from "@/lib/use-media-query";
import { IconDocument, IconList, IconPlay, IconSettings } from "@/lib/ui-icons";
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
  const [playRequest, setPlayRequest] = useState<{ token: number } | undefined>();
  const isMobile = useMediaQuery("(max-width: 767px)");

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
      episodeSlug={latestEpisode.slug}
      playRequest={playRequest}
      seekRequest={seekRequest}
      variant="spotify"
    />
  ) : null;

  return (
    <PlayerShell player={player} rssUrl={rssUrl}>
      {!hasEpisodes ? (
        <div className="spotify-panel flex min-h-[50vh] flex-col items-center justify-center p-10 text-center">
          <p className="text-sm font-semibold text-white/55">No episodes yet</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">Generate your first digest</h1>
          <Link
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-[var(--spotify-green)] px-5 py-3 text-sm font-bold text-black transition hover:bg-[#1ed760]"
            href="/settings"
          >
            <IconSettings className="h-4 w-4" />
            Open settings
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
          <div className="min-w-0 space-y-4">
            <section className="spotify-panel overflow-hidden">
              <div className="bg-gradient-to-b from-white/[0.08] to-transparent px-5 py-5 sm:px-7 sm:py-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white/55">{headlineDate ?? "Today"}</p>
                    <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-4xl">Home</h1>
                  </div>
                  <button
                    aria-label="Open TL;DR"
                    className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/15 hover:text-white md:gap-2 md:px-4 md:py-2 md:text-sm md:font-bold"
                    onClick={() => setInsightsOpen(true)}
                    type="button"
                  >
                    <IconDocument className="h-5 w-5" />
                    <span className="hidden md:inline">TL;DR</span>
                  </button>
                </div>

                <div className="mt-4">
                  <ContinueListeningBanner
                    durationSeconds={latestEpisode.durationSeconds}
                    episodeSlug={latestEpisode.slug}
                    onResume={(seconds) => {
                      setSeekRequest({ seconds, token: Date.now() });
                      setPlayRequest({ token: Date.now() });
                    }}
                  />
                </div>

                <div className="mt-4 flex flex-row items-start gap-3 sm:mt-5 sm:gap-4 sm:items-center">
                  <EpisodeCoverArt
                    className="shrink-0 sm:items-start [&_img]:!h-24 [&_img]:!w-24 sm:[&_img]:!h-auto sm:[&_img]:!w-auto"
                    title={latestEpisode.title}
                    topics={latestEpisode.topics}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white/60">Today’s digest</p>
                    <Link
                      className="mt-1 block text-xl font-bold tracking-tight text-white transition hover:text-[var(--spotify-green)] sm:text-2xl"
                      href={`/digest/${latestEpisode.slug}`}
                    >
                      {latestEpisode.title}
                    </Link>
                    {latestEpisode.introText ? (
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/55">{latestEpisode.introText}</p>
                    ) : null}
                    <p className="mt-2 text-sm text-white/45">
                      {latestEpisode.items.length} stories ·{" "}
                      {latestEpisode.durationSeconds ? Math.round(latestEpisode.durationSeconds / 60) : "—"} min
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button
                        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--spotify-green)] px-5 py-2.5 text-sm font-bold text-black transition hover:bg-[#1ed760] active:scale-[0.98]"
                        onClick={() => setPlayRequest({ token: Date.now() })}
                        type="button"
                      >
                        <IconPlay className="h-4 w-4" />
                        Play
                      </button>
                      <Link
                        className="inline-flex min-h-11 items-center rounded-full bg-white/10 px-4 py-2.5 text-sm font-bold text-white/80 transition hover:bg-white/15 hover:text-white"
                        href={`/digest/${latestEpisode.slug}`}
                      >
                        Full episode
                      </Link>
                    </div>
                    <div className="spotify-row-scroll mt-3 flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible">
                      {(personalizedTopics.length ? personalizedTopics : latestEpisode.topics).slice(0, 8).map((topic) => (
                        <span
                          key={topic}
                          className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70"
                          title={topic}
                        >
                          #{topic}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="spotify-panel p-5 sm:p-6" id="player">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <IconList className="h-5 w-5 text-white/70" />
                  <h2 className="text-lg font-bold text-white">Now playing</h2>
                </div>
                <Link
                  className="inline-flex min-h-11 items-center rounded-full px-3 py-1.5 text-xs font-bold text-white/60 transition hover:bg-white/10 hover:text-white"
                  href="/settings"
                >
                  Edit stations
                </Link>
              </div>

              <div className="rounded-md bg-[var(--spotify-elevated)] p-3">
                <BroadcastPlaylist
                  activeChapterId={activeChapter?.id}
                  chapters={latestEpisode.chapters}
                  currentTime={currentTime}
                  isPlaying={isPlaying}
                  items={latestEpisode.items}
                  maxVisibleItems={isMobile ? 3 : undefined}
                  onItemInfo={setThreadDetail}
                  onSelect={(seconds) => {
                    setSeekRequest({ seconds, token: Date.now() });
                  }}
                  onShowAll={isMobile ? requestExpandPlayer : undefined}
                  variant="spotify"
                />
              </div>
            </section>

            <section className="spotify-panel p-5 sm:p-6" id="stations">
              <h2 className="text-lg font-bold text-white">Your stations</h2>
              <p className="mt-1 text-sm text-white/50">From your settings (used for personalization).</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedSubreddits.map((subreddit) => (
                  <span
                    key={subreddit}
                    className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70"
                    title={`r/${subreddit}`}
                  >
                    r/{subreddit}
                  </span>
                ))}
              </div>
            </section>
          </div>

          <div className="hidden space-y-4 xl:block">
            <ArchiveSidebar
              activeEpisodeId={latestEpisode.id}
              episodes={episodes}
              rssUrl={rssUrl}
              variant="spotify"
            />
          </div>
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
