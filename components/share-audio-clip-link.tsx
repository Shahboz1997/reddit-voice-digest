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
    <div>
      <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">Shareable clip</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-200">
          {clipLabel} · starts at {formatClipTime(startSeconds)}
        </span>
        <button
          className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20"
          onClick={onCopy}
          type="button"
        >
          Copy clip link
        </button>
      </div>
      {status ? <p className="mt-2 text-sm text-slate-400">{status}</p> : null}
    </div>
  );
}
