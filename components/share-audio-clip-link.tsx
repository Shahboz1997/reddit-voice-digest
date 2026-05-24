"use client";

import { useMemo, useState } from "react";

interface ShareAudioClipLinkProps {
  episodeSlug: string;
  startSeconds: number;
  clipLabel: string;
}

function formatClipTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${seconds}`;
}

export function ShareAudioClipLink({
  episodeSlug,
  startSeconds,
  clipLabel,
}: ShareAudioClipLinkProps) {
  const [status, setStatus] = useState<string | null>(null);

  const clipUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return `/digest/${episodeSlug}?t=${startSeconds}`;
    }

    const base = window.location.origin.replace(/\/$/, "");
    return `${base}/digest/${episodeSlug}?t=${startSeconds}`;
  }, [episodeSlug, startSeconds]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(clipUrl);
      setStatus("Clip link copied.");
    } catch {
      setStatus("Could not copy the link.");
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <span
        className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60"
        title={`Starts at ${formatClipTime(startSeconds)}`}
      >
        {clipLabel} · {formatClipTime(startSeconds)}
      </span>
      <button
        aria-label="Copy clip link"
        className="inline-flex h-9 items-center justify-center rounded-full border border-[var(--radio-pink)]/30 bg-[var(--radio-pink)]/10 px-4 text-xs font-bold uppercase tracking-wider text-[var(--radio-pink)] transition hover:bg-[var(--radio-pink)]/20"
        onClick={onCopy}
        type="button"
      >
        Copy link
      </button>
      {status ? <span className="text-xs text-white/40">{status}</span> : null}
    </div>
  );
}
