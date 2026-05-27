"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { AudioPlayer } from "@/components/audio-player";
import { BroadcastPlaylist } from "@/components/broadcast-playlist";
import { InsightDrawer } from "@/components/insight-drawer";
import { PlayerShell } from "@/components/player-shell";
import { ShareAudioClipLink } from "@/components/share-audio-clip-link";
import { EpisodeCoverArt } from "@/components/subreddit-art";
import { ThreadDetailDrawer } from "@/components/thread-detail-drawer";
import { formatDigestDate } from "@/lib/date";
import { IconDocument } from "@/lib/ui-icons";
import type { DigestChapter, DigestEpisode, DigestItem } from "@/lib/types";

interface DigestPageClientProps {
  episode: DigestEpisode;
  rssUrl: string;
  initialSeekSeconds?: number;
}

function pickHighlightClip(items: DigestItem[]) {
  if (!items.length) {
    return null;
  }

  const primary = items[0];
  const clipLength = Math.min(60, Math.max(20, primary.endSeconds - primary.startSeconds));
  const midpoint =
    primary.startSeconds + Math.max(0, (primary.endSeconds - primary.startSeconds - clipLength) / 2);

  return {
    ...primary,
    startSeconds: Math.round(midpoint),
  };
}

export function DigestPageClient({ episode, rssUrl, initialSeekSeconds = 0 }: DigestPageClientProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeChapter, setActiveChapter] = useState<DigestChapter | undefined>();
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [threadDetail, setThreadDetail] = useState<DigestItem | null>(null);
  const [seekRequest, setSeekRequest] = useState<{ seconds: number; token: number } | undefined>();

  const highlightItem = useMemo(() => pickHighlightClip(episode.items), [episode.items]);
  const dateLabel = formatDigestDate(episode.publishedAt, { day: "numeric", month: "short", year: "numeric" });

  const player = (
    <AudioPlayer
      audioUrl={episode.audioUrl}
      chapters={episode.chapters}
      durationSeconds={episode.durationSeconds}
      initialSeekSeconds={initialSeekSeconds}
      nowPlayingTitle={episode.title}
      onPlaybackChange={setIsPlaying}
      onTimeUpdate={(time, chapter) => {
        setCurrentTime(time);
        setActiveChapter(chapter);
      }}
      episodeSlug={episode.slug}
      playlistItems={episode.items}
      seekRequest={seekRequest}
      variant="spotify"
    />
  );

  return (
    <PlayerShell player={player} rssUrl={rssUrl}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            className="text-sm font-semibold text-white/50 transition hover:text-white"
            href="/"
          >
            ← Home
          </Link>
          <span className="text-white/20">·</span>
          <span className="text-sm font-semibold text-white/45" title={episode.publishedAt}>
            {dateLabel}
          </span>
        </div>

        <section className="spotify-panel overflow-hidden">
          <div className="bg-gradient-to-b from-white/[0.08] to-transparent px-5 py-5 sm:px-7 sm:py-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{episode.title}</h1>
                {episode.summary ? (
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-white/55">{episode.summary}</p>
                ) : null}
              </div>
              <button
                aria-label="Open TL;DR"
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white/80 transition hover:bg-white/15 hover:text-white"
                onClick={() => setInsightsOpen(true)}
                type="button"
              >
                <IconDocument className="h-4 w-4" />
                TL;DR
              </button>
            </div>

            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start">
              <EpisodeCoverArt className="sm:items-start" title={episode.title} topics={episode.topics} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-1.5">
                  {episode.topics.map((topic) => (
                    <span
                      key={topic}
                      className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70"
                      title={topic}
                    >
                      #{topic}
                    </span>
                  ))}
                </div>
                {highlightItem ? (
                  <div className="mt-4">
                    <ShareAudioClipLink
                      clipLabel={`r/${highlightItem.subredditName}`}
                      episodeSlug={episode.slug}
                      startSeconds={highlightItem.startSeconds}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="spotify-panel p-5 sm:p-6">
          <div className="rounded-md bg-[var(--spotify-elevated)] p-3">
            <BroadcastPlaylist
              activeChapterId={activeChapter?.id}
              chapters={episode.chapters}
              currentTime={currentTime}
              isPlaying={isPlaying}
              items={episode.items}
              onItemInfo={setThreadDetail}
              onSelect={(seconds) => setSeekRequest({ seconds, token: Date.now() })}
              variant="spotify"
            />
          </div>
        </section>
      </div>

      <InsightDrawer episode={episode} onClose={() => setInsightsOpen(false)} open={insightsOpen} />
      <ThreadDetailDrawer item={threadDetail} onClose={() => setThreadDetail(null)} />
    </PlayerShell>
  );
}
