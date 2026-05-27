"use client";

import { useSyncExternalStore } from "react";

import { loadPlaybackPosition, subscribePlaybackPosition } from "@/lib/playback-position";
import { IconPlay } from "@/lib/ui-icons";

interface ContinueListeningBannerProps {
  episodeSlug: string;
  durationSeconds: number;
  onResume: (seconds: number) => void;
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${seconds}`;
}

export function ContinueListeningBanner({
  episodeSlug,
  durationSeconds,
  onResume,
}: ContinueListeningBannerProps) {
  const saved = useSyncExternalStore(subscribePlaybackPosition, loadPlaybackPosition, () => null);

  if (!saved || saved.slug !== episodeSlug) {
    return null;
  }

  const resumeAt = Math.min(Math.max(saved.seconds, 0), Math.max(durationSeconds - 5, 0));
  const nearEnd = durationSeconds > 0 && resumeAt >= durationSeconds - 15;

  if (resumeAt < 10 || nearEnd) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/10 px-4 py-3">
      <p className="text-sm font-medium text-[var(--app-text)]">
        Continue from <span className="font-mono tabular-nums">{formatTime(resumeAt)}</span>
      </p>
      <button
        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--accent-primary)] px-4 py-2 text-sm font-bold text-[var(--accent-on-primary)] transition hover:bg-[var(--accent-primary-hover)] active:scale-[0.98]"
        onClick={() => onResume(resumeAt)}
        type="button"
      >
        <IconPlay className="h-4 w-4" />
        Resume
      </button>
    </div>
  );
}
