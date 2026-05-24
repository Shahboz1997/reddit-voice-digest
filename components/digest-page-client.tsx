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
import { IconChevronLeft, IconDocument } from "@/lib/ui-icons";
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
      playlistItems={episode.items}
      seekRequest={seekRequest}
      variant="spotify"
    />
  );

  return (
    <PlayerShell
      isPlaying={isPlaying}
      player={player}
      rssUrl={rssUrl}
      topBar={
        <Link
          className="mr-auto flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/50 transition hover:text-white"
          href="/"
          title="Back"
        >
          <IconChevronLeft className="h-5 w-5" />
        </Link>
      }
    >
      <div className="space-y-6">
        <section className="flex flex-col gap-6 lg:flex-row">
          <div className="radio-glass flex flex-1 flex-col items-center rounded-2xl px-6 py-8">
            <div className="mb-4 flex w-full items-center justify-between">
              <span
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-white/50"
                title={episode.publishedAt}
              >
                {dateLabel}
              </span>
              <button
                aria-label="TL;DR"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/50 transition hover:border-[var(--radio-pink)]/40 hover:text-[var(--radio-pink)]"
                onClick={() => setInsightsOpen(true)}
                type="button"
              >
                <IconDocument className="h-4 w-4" />
              </button>
            </div>
            <EpisodeCoverArt title={episode.title} topics={episode.topics} />
            <div className="mt-4 flex flex-wrap justify-center gap-1.5">
              {episode.topics.map((topic) => (
                <span
                  key={topic}
                  className="rounded-md border border-[var(--radio-pink)]/20 bg-[var(--radio-pink)]/10 px-2 py-0.5 font-display text-[10px] font-bold uppercase text-[var(--radio-pink)]"
                  title={topic}
                >
                  #{topic}
                </span>
              ))}
            </div>
            {highlightItem ? (
              <div className="mt-6 w-full max-w-md">
                <ShareAudioClipLink
                  clipLabel={`r/${highlightItem.subredditName}`}
                  episodeSlug={episode.slug}
                  startSeconds={highlightItem.startSeconds}
                />
              </div>
            ) : null}
          </div>

          <div className="radio-glass min-h-[360px] w-full rounded-2xl p-4 lg:max-w-md">
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
