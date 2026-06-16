"use client";

import { SubredditArt } from "@/components/subreddit-art";
import { getSubredditStation } from "@/lib/subreddit-stations";

interface SubredditPriorityQueueProps {
  subreddits: string[];
  dragIndex: number | null;
  onDragIndexChange: (index: number | null) => void;
  onMove: (fromIndex: number, toIndex: number) => void;
  onRemove: (name: string) => void;
}

function GripIcon() {
  return (
    <svg aria-hidden className="h-4 w-4 text-[var(--app-text-muted)]" fill="currentColor" viewBox="0 0 24 24">
      <circle cx="9" cy="7" r="1.5" />
      <circle cx="15" cy="7" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="17" r="1.5" />
      <circle cx="15" cy="17" r="1.5" />
    </svg>
  );
}

export function SubredditPriorityQueue({
  subreddits,
  dragIndex,
  onDragIndexChange,
  onMove,
  onRemove,
}: SubredditPriorityQueueProps) {
  if (subreddits.length === 0) {
    return (
      <p className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-elevated)] px-4 py-8 text-center text-sm text-[var(--app-text-muted)]">
        Add communities from the rows above — they will appear here in playback order.
      </p>
    );
  }

  return (
    <ol className="divide-y divide-[var(--app-border)] overflow-hidden rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-elevated)]">
      {subreddits.map((name, index) => {
        const { label } = getSubredditStation(name);

        return (
          <li
            key={name}
            className="group flex cursor-grab items-center gap-3 px-3 py-2 transition hover:bg-[var(--app-chip-hover)] active:cursor-grabbing"
            draggable
            onDragEnd={() => onDragIndexChange(null)}
            onDragOver={(event) => {
              event.preventDefault();
            }}
            onDragStart={() => onDragIndexChange(index)}
            onDrop={() => {
              if (dragIndex === null || dragIndex === index) return;
              onMove(dragIndex, index);
              onDragIndexChange(null);
            }}
          >
            <span className="w-5 shrink-0 text-center text-sm tabular-nums text-[var(--app-text-muted)]">
              {index + 1}
            </span>
            <SubredditArt size="sm" subredditName={name} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--app-text)]">{label}</p>
              <p className="truncate text-xs text-[var(--app-text-muted)]">r/{name}</p>
            </div>
            <button
              className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium text-[var(--app-text-muted)] opacity-0 transition hover:bg-[var(--app-chip-bg)] hover:text-[var(--app-text)] group-hover:opacity-100"
              onClick={() => onRemove(name)}
              type="button"
            >
              Remove
            </button>
            <span className="shrink-0 pr-1" title="Drag to reorder">
              <GripIcon />
            </span>
          </li>
        );
      })}
    </ol>
  );
}
