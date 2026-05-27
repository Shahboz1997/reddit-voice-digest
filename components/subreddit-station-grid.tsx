"use client";

import { useMemo } from "react";

import { SubredditArt } from "@/components/subreddit-art";
import { groupSourcesByCategory } from "@/lib/subreddit-categories";
import { getSubredditStation } from "@/lib/subreddit-stations";
import type { SourceSeed } from "@/lib/types";

interface SubredditStationGridProps {
  sources: SourceSeed[];
  selected: string[];
  onToggle: (subredditName: string) => void;
}

function CheckIcon() {
  return (
    <svg aria-hidden className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
  );
}

export function SubredditStationGrid({ sources, selected, onToggle }: SubredditStationGridProps) {
  const rows = useMemo(() => groupSourcesByCategory(sources), [sources]);

  return (
    <div className="space-y-10">
      {rows.map(({ category, sources: rowSources }) => (
        <section key={category.id}>
          <h3 className="text-xl font-bold tracking-tight text-[var(--app-text)] sm:text-2xl">{category.title}</h3>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:flex sm:gap-4 sm:overflow-x-auto sm:pb-3 spotify-row-scroll">
            {rowSources.map((source) => {
              const name = source.subreddit_name;
              const isSelected = selected.includes(name);
              const { label } = getSubredditStation(name);

              return (
                <button
                  key={name}
                  aria-label={`${isSelected ? "Remove" : "Add"} r/${name}`}
                  aria-pressed={isSelected}
                  className={`spotify-station-card group relative h-[140px] w-full overflow-hidden rounded-md text-left transition hover:scale-[1.02] active:scale-[0.98] sm:h-[220px] sm:w-[180px] sm:shrink-0 ${
                    isSelected ? "ring-2 ring-[var(--spotify-green)] ring-offset-2 ring-offset-[var(--app-bg)]" : ""
                  }`}
                  onClick={() => onToggle(name)}
                  style={{ backgroundColor: category.color }}
                  title={`r/${name}`}
                  type="button"
                >
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -right-3 top-5 rotate-[22deg] shadow-[0_12px_28px_rgba(0,0,0,0.45)] transition group-hover:rotate-[18deg]"
                  >
                    <SubredditArt className="!h-[104px] !w-[104px] !rounded-md" size="lg" subredditName={name} />
                  </div>

                  <p className="absolute right-4 bottom-4 left-4 line-clamp-3 text-lg font-bold leading-snug text-white drop-shadow-sm">
                    {label}
                  </p>

                  <p className="absolute top-3 left-3 text-[11px] font-medium text-white/70">r/{name}</p>

                  {isSelected ? (
                    <span className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--spotify-green)] text-black shadow-md">
                      <CheckIcon />
                    </span>
                  ) : (
                    <span className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/25 text-white/0 opacity-0 ring-1 ring-white/20 transition group-hover:bg-black/40 group-hover:text-white/90 group-hover:opacity-100">
                      +
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
