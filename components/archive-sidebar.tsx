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
  /** Highlights the episode currently on the home player or digest page. */
  activeEpisodeId?: string;
}

function formatShortDate(value: string) {
  return formatDigestDate(value, {
    month: "short",
    day: "numeric",
  });
}

export function ArchiveSidebar({
  episodes,
  rssUrl,
  variant = "default",
  activeEpisodeId,
}: ArchiveSidebarProps) {
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
    <aside className="space-y-6" id="archive">
      <section
        className={`p-5 ${isSpotify ? "spotify-panel" : isRadio ? "radio-glass rounded-2xl" : "rounded-[2rem] border border-white/10 bg-white/5"}`}
      >
        <div className="flex items-center gap-2">
          <IconSearch className={`h-5 w-5 ${isRadio ? "text-[var(--radio-yellow)]" : "text-cyan-300"}`} />
          <h2 className="font-display text-sm font-extrabold uppercase tracking-wide text-white">
            {isSpotify ? "Archive" : "Past issues and search"}
          </h2>
        </div>

        <div className="relative mt-4">
          <IconSearch
            aria-hidden
            className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isSpotify ? "text-white/35" : "text-white/40"}`}
          />
          <input
            aria-label="Search episodes"
            className={`w-full py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-white/30 ${
              isSpotify
                ? "rounded-md border-0 bg-[#2a2a2a] focus:ring-2 focus:ring-[var(--spotify-green)]"
                : isRadio
                  ? "rounded-xl border border-white/10 bg-black/60 focus:border-[var(--radio-pink)]/50"
                  : "rounded-2xl border border-white/10 bg-slate-950/70 focus:border-cyan-300/40"
            }`}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={isSpotify ? "Search episodes…" : "Search topics or keywords"}
            type="search"
            value={query}
          />
        </div>

        {episodes.length > 1 ? (
          <div className="mt-5 grid grid-cols-3 gap-2">
            {episodes.slice(0, 6).map((episode) => {
              const isActive = episode.id === activeEpisodeId;

              return (
                <Link
                  key={episode.id}
                  className={`rounded-md px-2 py-2.5 text-center transition ${
                    isSpotify
                      ? isActive
                        ? "bg-[var(--spotify-green)]/20 ring-1 ring-[var(--spotify-green)]/60"
                        : "bg-[var(--spotify-elevated)] hover:bg-[#2a2a2a]"
                      : isActive
                        ? "border border-cyan-300/40 bg-cyan-400/10"
                        : "rounded-2xl border border-white/10 bg-slate-950/60 hover:border-cyan-300/30 hover:bg-white/10"
                  }`}
                  href={`/digest/${episode.slug}`}
                >
                  <p
                    className={`text-[10px] font-bold uppercase tracking-wider ${isSpotify ? "text-white/45" : "text-cyan-300"}`}
                  >
                    {formatDigestDate(episode.publishedAt, { weekday: "short" })}
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-white">{formatShortDate(episode.publishedAt)}</p>
                </Link>
              );
            })}
          </div>
        ) : null}

        <div className="mt-5 space-y-3">
          {filtered.length === 0 ? (
            <p className="rounded-md bg-[var(--spotify-elevated)] px-4 py-6 text-center text-sm text-white/45">
              No episodes match &ldquo;{query.trim()}&rdquo;
            </p>
          ) : null}
          {filtered.map((episode) => {
            const isActive = episode.id === activeEpisodeId;

            return (
            <Link
              key={episode.id}
              className={`block p-4 transition ${
                isSpotify
                  ? isActive
                    ? "rounded-md bg-[var(--spotify-green)]/15 ring-1 ring-[var(--spotify-green)]/50"
                    : "rounded-md bg-[var(--spotify-elevated)] hover:bg-[#2a2a2a]"
                  : isActive
                    ? "rounded-3xl border border-cyan-300/40 bg-cyan-400/10"
                    : "rounded-3xl border border-white/10 bg-slate-950/60 hover:border-cyan-300/30 hover:bg-white/10"
              }`}
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
            );
          })}
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
