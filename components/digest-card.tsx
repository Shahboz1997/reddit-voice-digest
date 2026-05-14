import Link from "next/link";

import { formatDigestDate } from "@/lib/date";
import type { DigestEpisode } from "@/lib/types";

interface DigestCardProps {
  episode: DigestEpisode;
}

export function DigestCard({ episode }: DigestCardProps) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20">
      <div className="mb-3 flex items-center gap-3 text-xs uppercase tracking-[0.24em] text-cyan-300">
        <span>{episode.durationLabel}</span>
        <span className="h-1 w-1 rounded-full bg-cyan-300" />
        <span>{formatDigestDate(episode.publishedAt)}</span>
      </div>

      <h2 className="text-2xl font-semibold text-white">{episode.title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{episode.summary}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {episode.items.map((item) => (
          <span
            key={item.id}
            className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100"
          >
            r/{item.subredditName}
          </span>
        ))}
      </div>

      <Link
        className="mt-6 inline-flex items-center rounded-full bg-cyan-400 px-5 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-300"
        href={`/digest/${episode.slug}`}
      >
        Open digest
      </Link>
    </article>
  );
}
