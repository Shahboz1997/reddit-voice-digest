"use client";

import { useMemo } from "react";

import { AudioPlayer } from "@/components/audio-player";
import { ShareAudioClipLink } from "@/components/share-audio-clip-link";
import type { DigestEpisode, DigestItem } from "@/lib/types";

interface DigestAudioSectionProps {
  episode: DigestEpisode;
}

function parseInitialSeekSeconds() {
  if (typeof window === "undefined") {
    return 0;
  }

  const raw = new URLSearchParams(window.location.search).get("t");
  const parsed = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
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

export function DigestAudioSection({ episode }: DigestAudioSectionProps) {
  const initialSeekSeconds = useMemo(() => parseInitialSeekSeconds(), []);
  const highlightItem = useMemo(() => pickHighlightClip(episode.items), [episode.items]);

  return (
    <div className="space-y-4">
      <AudioPlayer
        audioUrl={episode.audioUrl}
        chapters={episode.chapters}
        durationSeconds={episode.durationSeconds}
        initialSeekSeconds={initialSeekSeconds}
        nowPlayingTitle={episode.title}
        playlistItems={episode.items}
        variant="radio"
      />

      {highlightItem ? (
        <ShareAudioClipLink
          clipLabel={`Best insight from r/${highlightItem.subredditName}`}
          episodeSlug={episode.slug}
          startSeconds={highlightItem.startSeconds}
        />
      ) : null}
    </div>
  );
}