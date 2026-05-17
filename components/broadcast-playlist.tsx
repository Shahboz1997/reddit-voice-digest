"use client";

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
}

export function BroadcastPlaylist({
  items,
  chapters,
  currentTime,
  isPlaying,
  activeChapterId,
  onSelect,
}: BroadcastPlaylistProps) {
  return (
    <aside className="flex h-full min-h-0 flex-col">
      <div className="mb-4 flex items-end justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <p className="font-display text-[10px] font-bold uppercase tracking-[0.35em] text-[var(--radio-yellow)]">
            On air
          </p>
          <h2 className="font-display mt-1 text-xl font-extrabold uppercase tracking-wide text-white">
            Broadcast grid
          </h2>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-widest ${
            isPlaying
              ? "bg-[var(--radio-pink)]/20 text-[var(--radio-pink)] ring-1 ring-[var(--radio-pink)]/40"
              : "bg-white/5 text-white/40"
          }`}
        >
          {isPlaying ? "Live" : "Standby"}
        </span>
      </div>

      <ol className="broadcast-playlist-scroll flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
        {items.map((item, index) => {
          const chapter = chapters[index];
          const isActive =
            chapter &&
            (activeChapterId === chapter.id ||
              (currentTime >= chapter.startSeconds &&
                currentTime < Math.max(chapter.endSeconds, chapter.startSeconds + 1)));

          return (
            <li key={item.id}>
              <button
                className={`group flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition ${
                  isActive
                    ? "border-[var(--radio-pink)]/50 bg-[var(--radio-pink)]/10 shadow-[0_0_24px_rgba(255,45,146,0.15)]"
                    : "border-white/8 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
                }`}
                onClick={() => onSelect(chapter?.startSeconds ?? item.startSeconds)}
                type="button"
              >
                <span
                  className={`font-display mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
                    isActive
                      ? "bg-[var(--radio-pink)] text-black"
                      : "bg-white/10 text-white/50 group-hover:text-white"
                  }`}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--radio-yellow)]/90">
                    r/{item.subredditName}
                  </span>
                  <span className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-white">
                    {item.threadTitle}
                  </span>
                  <span className="mt-2 flex items-center gap-2 text-[11px] text-white/45">
                    <span className="font-mono tabular-nums">
                      {formatTime(chapter?.startSeconds ?? item.startSeconds)}
                    </span>
                    {isActive && isPlaying ? (
                      <span className="font-display text-[10px] font-bold uppercase tracking-wider text-[var(--radio-pink)]">
                        Now playing
                      </span>
                    ) : null}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
