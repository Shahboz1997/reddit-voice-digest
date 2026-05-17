"use client";

import { getSubredditStation } from "@/lib/subreddit-stations";
import type { SourceSeed } from "@/lib/types";

interface SubredditStationGridProps {
  sources: SourceSeed[];
  selected: string[];
  onToggle: (subredditName: string) => void;
}

export function SubredditStationGrid({ sources, selected, onToggle }: SubredditStationGridProps) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
      {sources.map((source) => {
        const name = source.subreddit_name;
        const isSelected = selected.includes(name);
        const { label, Icon } = getSubredditStation(name);

        return (
          <button
            key={name}
            aria-label={`${isSelected ? "Remove" : "Add"} r/${name}`}
            aria-pressed={isSelected}
            className={`station-tile group relative flex aspect-square flex-col items-center justify-center gap-2 rounded-xl p-2 transition ${
              isSelected
                ? "station-tile--active bg-[#2a2a2a] ring-2 ring-[var(--radio-pink)]"
                : "bg-[#181818] hover:bg-[#222222]"
            }`}
            onClick={() => onToggle(name)}
            title={`r/${name}`}
            type="button"
          >
            {isSelected ? (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--radio-pink)] text-[9px] font-black text-black">
                ✓
              </span>
            ) : null}

            <Icon
              className={`h-9 w-9 shrink-0 transition ${
                isSelected ? "text-white" : "text-white/75 group-hover:text-white"
              }`}
            />

            <span
              className={`line-clamp-2 w-full px-0.5 text-center font-display text-[10px] font-bold leading-tight uppercase tracking-wide ${
                isSelected ? "text-white" : "text-white/65 group-hover:text-white/90"
              }`}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
