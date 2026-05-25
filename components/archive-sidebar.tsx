"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { formatDigestDate } from "@/lib/date";
import { IconRss, IconSearch, IconSettings } from "@/lib/ui-icons";
import type { DigestEpisode } from "@/lib/types";

interface ArchiveSidebarProps {
  episodes: DigestEpisode[];
  rssUrl: string;
  variant?: "default" | "radio" | "spotify";
}

function formatShortDate(value: string) {
  return formatDigestDate(value, {
    month: "short",
    day: "numeric",
  });
}

export function ArchiveSidebar({ episodes, rssUrl, variant = "default" }: ArchiveSidebarProps) {
  const isRadio = variant === "radio" || variant === "spotify";
  const isSpotify = variant === "spotify";
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return episodes;
    }

    return episodes.filter((episode) => {
      const haystack = [
        episode.title,
        episode.summary,
        ...episode.topics,
        ...episode.keyThoughts,
        ...episode.items.map((item) => item.threadTitle),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalized);
    });
  }, [episodes, query]);

  return (
    <aside className="space-y-6">
      <section
        className={`rounded-2xl p-5 ${isRadio ? "radio-glass" : "rounded-[2rem] border border-white/10 bg-white/5"}`}
      >
        <div className="flex items-center gap-2">
          <IconSearch className={`h-5 w-5 ${isRadio ? "text-[var(--radio-yellow)]" : "text-cyan-300"}`} />
          <h2 className="font-display text-sm font-extrabold uppercase tracking-wide text-white">
            {isSpotify ? "Archive" : "Past issues and search"}
          </h2>
        </div>

        <input
          aria-label="Search episodes"
          className={`mt-4 w-full rounded-xl border border-white/10 py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-white/30 ${isRadio ? "bg-black/60 focus:border-[var(--radio-pink)]/50" : "rounded-2xl bg-slate-950/70 focus:border-cyan-300/40"}`}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={isSpotify ? "Search…" : "Search topics or keywords"}
          type="search"
          value={query}
        />

        <div className="mt-5 grid grid-cols-3 gap-2">
          {episodes.map((episode) => (
            <Link
              key={episode.id}
              className="rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-3 text-center transition hover:border-cyan-300/30 hover:bg-white/10"
              href={`/digest/${episode.slug}`}
            >
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">
                {formatDigestDate(episode.publishedAt, { weekday: "short" })}
              </p>
              <p className="mt-1 text-sm font-medium text-white">{formatShortDate(episode.publishedAt)}</p>
            </Link>
          ))}
        </div>

        <div className="mt-5 space-y-3">
          {filtered.map((episode) => (
            <Link
              key={episode.id}
              className="block rounded-3xl border border-white/10 bg-slate-950/60 p-4 transition hover:border-cyan-300/30 hover:bg-white/10"
              href={`/digest/${episode.slug}`}
            >
              <div className="flex items-center justify-between gap-4">
                <p className={`font-medium text-white ${isSpotify ? "line-clamp-1 text-sm" : "text-sm"}`}>
                  {isSpotify ? formatShortDate(episode.publishedAt) : episode.title}
                </p>
                {!isSpotify ? (
                  <span className="text-xs text-slate-400">{formatShortDate(episode.publishedAt)}</span>
                ) : null}
              </div>

              {!isSpotify ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {episode.topics.map((topic) => (
                    <span
                      key={topic}
                      className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-xs text-cyan-100"
                    >
                      #{topic}
                    </span>
                  ))}
                </div>
              ) : null}
            </Link>
          ))}
        </div>
      </section>

      <section className={`rounded-2xl p-5 ${isRadio ? "radio-glass" : "rounded-[2rem] border border-white/10 bg-white/5"}`}>
        <div className="flex items-center gap-2">
          <IconRss className={`h-5 w-5 ${isRadio ? "text-[var(--radio-yellow)]" : "text-cyan-300"}`} />
          <h2 className="font-display text-sm font-extrabold uppercase tracking-wide text-white">
            {isSpotify ? "RSS" : "Smart delivery"}
          </h2>
        </div>
        {!isSpotify ? (
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Paste the feed URL into Spotify or Apple Podcasts. Telegram is in preferences.
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <a
            aria-label="Podcast RSS feed"
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition ${
              isRadio
                ? "bg-[var(--radio-pink)] text-black hover:brightness-110"
                : "bg-cyan-400 text-slate-950 hover:bg-cyan-300"
            }`}
            href={rssUrl}
            rel="noopener noreferrer"
            target="_blank"
            title="Podcast RSS"
          >
            <IconRss className="h-5 w-5" />
          </a>
          <Link
            aria-label="Delivery settings"
            className="inline-flex h-10 items-center justify-center rounded-full border border-white/10 px-4 font-display text-[10px] font-bold uppercase tracking-wider text-white/70 transition hover:border-[var(--radio-pink)]/40 hover:text-[var(--radio-pink)]"
            href="/settings"
            title="Settings"
          >
            {isSpotify ? <IconSettings className="h-4 w-4" /> : "Configure delivery"}
          </Link>
        </div>
      </section>
    </aside>
  );
}
