"use client";

import { Equalizer } from "@/components/equalizer";
import { SubredditArt } from "@/components/subreddit-art";
import { IconDocument, IconList } from "@/lib/ui-icons";
import type { DigestChapter, DigestItem } from "@/lib/types";

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${seconds}`;
}

interface BroadcastPlaylistProps {
  items: DigestItem[];
  chapters: DigestChapter[];
  currentTime: number;
  isPlaying: boolean;
  activeChapterId?: string;
  onSelect: (startSeconds: number) => void;
  onItemInfo?: (item: DigestItem) => void;
  variant?: "default" | "radio" | "spotify";
}

export function BroadcastPlaylist({
  items,
  chapters,
  currentTime,
  isPlaying,
  activeChapterId,
  onSelect,
  onItemInfo,
  variant = "default",
}: BroadcastPlaylistProps) {
  const isSpotify = variant === "spotify";
  const isRadio = variant === "radio" || isSpotify;

  return (
    <aside className="flex h-full min-h-0 flex-col">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <IconList className={`h-5 w-5 ${isRadio ? "text-[var(--radio-yellow)]" : "text-cyan-300"}`} />
          {!isSpotify ? (
            <div>
              <p
                className={`font-display text-[10px] font-bold uppercase tracking-[0.35em] ${isRadio ? "text-[var(--radio-yellow)]" : "text-sm tracking-[0.24em] text-cyan-300"}`}
              >
                On air
              </p>
              <h2 className="font-display mt-1 text-xl font-extrabold uppercase tracking-wide text-white">
                Broadcast grid
              </h2>
            </div>
          ) : (
            <h2 className="font-display text-sm font-extrabold uppercase tracking-wider text-white">Queue</h2>
          )}
        </div>
        {isPlaying ? (
          <span
            className={`flex items-center gap-1.5 rounded-full px-2 py-1 ${isRadio ? "bg-[var(--radio-pink)]/20 text-[var(--radio-pink)] ring-1 ring-[var(--radio-pink)]/40" : "bg-cyan-400/15 text-cyan-300"}`}
            title="Playing"
          >
            <Equalizer active className="!h-4 !gap-[2px] [&_.equalizer__bar]:w-[2px]" />
            {!isSpotify ? (
              <span className="font-display text-[10px] font-bold uppercase tracking-widest">Live</span>
            ) : null}
          </span>
        ) : (
          <span className="h-2 w-2 rounded-full bg-white/20" title="Paused" />
        )}
      </div>

      <ol className="broadcast-playlist-scroll flex flex-1 flex-col gap-1.5 overflow-y-auto pr-1">
        {items.map((item, index) => {
          const chapter = chapters[index];
          const isActive =
            chapter &&
            (activeChapterId === chapter.id ||
              (currentTime >= chapter.startSeconds &&
                currentTime < Math.max(chapter.endSeconds, chapter.startSeconds + 1)));

          return (
            <li key={item.id}>
              <div
                className={`group flex w-full items-center gap-2 rounded-xl border transition ${
                  isActive
                    ? "border-[var(--radio-pink)]/50 bg-[var(--radio-pink)]/10 shadow-[0_0_20px_rgba(255,45,146,0.12)]"
                    : "border-white/8 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
                }`}
              >
                <button
                  className="flex min-w-0 flex-1 items-center gap-3 px-2 py-2.5 text-left sm:px-3"
                  onClick={() => onSelect(chapter?.startSeconds ?? item.startSeconds)}
                  type="button"
                >
                  <SubredditArt size="sm" subredditName={item.subredditName} />
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 text-sm font-semibold text-white">{item.threadTitle}</span>
                    <span className="mt-0.5 flex items-center gap-2 font-mono text-[11px] tabular-nums text-white/40">
                      {formatTime(chapter?.startSeconds ?? item.startSeconds)}
                      {isActive && isPlaying ? (
                        <Equalizer active className="!h-3 !gap-[2px] [&_.equalizer__bar]:w-[2px]" />
                      ) : null}
                    </span>
                  </span>
                </button>
                {onItemInfo ? (
                  <button
                    aria-label="Thread details"
                    className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/40 opacity-0 transition group-hover:opacity-100 hover:bg-white/10 hover:text-white"
                    onClick={() => onItemInfo(item)}
                    type="button"
                  >
                    <IconDocument className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
