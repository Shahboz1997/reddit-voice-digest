"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { formatDigestDate } from "@/lib/date";
import type { DigestEpisode } from "@/lib/types";

interface ArchiveSidebarProps {
  episodes: DigestEpisode[];
  rssUrl: string;
  variant?: "default" | "radio";
}

function formatShortDate(value: string) {
  return formatDigestDate(value, {
    month: "short",
    day: "numeric",
  });
}

export function ArchiveSidebar({ episodes, rssUrl, variant = "default" }: ArchiveSidebarProps) {
  const isRadio = variant === "radio";
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
        <p
          className={`font-display text-[10px] font-bold uppercase tracking-[0.35em] ${isRadio ? "text-[var(--radio-yellow)]" : "text-sm tracking-[0.24em] text-cyan-300"}`}
        >
          Archive
        </p>
        <h2
          className={`mt-2 font-display font-extrabold uppercase tracking-wide text-white ${isRadio ? "text-lg" : "text-xl font-semibold normal-case"}`}
        >
          Past issues and search
        </h2>

        <input
          className={`mt-4 w-full rounded-xl border border-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 ${isRadio ? "bg-black/60 focus:border-[var(--radio-pink)]/50" : "rounded-2xl bg-slate-950/70 focus:border-cyan-300/40"}`}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search topics or keywords"
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
                <p className="text-sm font-medium text-white">{episode.title}</p>
                <span className="text-xs text-slate-400">{formatShortDate(episode.publishedAt)}</span>
              </div>

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
            </Link>
          ))}
        </div>
      </section>

      <section className={`rounded-2xl p-5 ${isRadio ? "radio-glass" : "rounded-[2rem] border border-white/10 bg-white/5"}`}>
        <p
          className={`font-display text-[10px] font-bold uppercase tracking-[0.35em] ${isRadio ? "text-[var(--radio-yellow)]" : "text-sm tracking-[0.24em] text-cyan-300"}`}
        >
          Notifications
        </p>
        <h2 className="mt-2 text-xl font-semibold text-white">Smart delivery</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          RSS follows the Apple Podcasts schema: paste the URL into Spotify (&quot;Add by RSS&quot;) or Apple
          Podcasts (&quot;Follow Show by URL&quot;). Default share URL uses{" "}
          <span className="text-cyan-100/90">/podcast.rss</span> (
          <span className="text-slate-400">canonical XML: /rss.xml</span>). Telegram is scaffolded in preferences.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <a
            className={`inline-flex rounded-full px-4 py-2 font-display text-xs font-bold uppercase tracking-wider transition ${
              isRadio
                ? "bg-[var(--radio-pink)] text-black hover:brightness-110"
                : "bg-cyan-400 text-sm font-medium text-slate-950 hover:bg-cyan-300"
            }`}
            href={rssUrl}
          >
            Podcast RSS (copy URL)
          </a>
          <Link
            className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:border-cyan-300/30 hover:text-cyan-200"
            href="/settings"
          >
            Configure delivery
          </Link>
        </div>
      </section>
    </aside>
  );
}
