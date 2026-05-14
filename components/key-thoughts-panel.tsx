"use client";

import { useMemo, useState } from "react";

import type { DigestEpisode } from "@/lib/types";

interface KeyThoughtsPanelProps {
  episode: DigestEpisode;
}

export function KeyThoughtsPanel({ episode }: KeyThoughtsPanelProps) {
  const [activeTab, setActiveTab] = useState<"thoughts" | "transcript">("thoughts");

  const insightCards = useMemo(() => {
    return episode.items.map((item) => ({
      id: item.id,
      title: item.threadTitle,
      summary: item.summary,
      points: item.tldrPoints,
      threadUrl: item.redditThreadUrl,
      commentUrl: item.redditCommentUrl,
      commentLabel: item.commentCtaLabel,
    }));
  }, [episode.items]);

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Text cards</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">TL;DR under the player</h2>
        </div>

        <div className="inline-flex rounded-full border border-white/10 bg-slate-950/50 p-1">
          <button
            className={`rounded-full px-4 py-2 text-sm ${
              activeTab === "thoughts" ? "bg-cyan-400 text-slate-950" : "text-slate-300"
            }`}
            onClick={() => setActiveTab("thoughts")}
            type="button"
          >
            Key thoughts
          </button>
          <button
            className={`rounded-full px-4 py-2 text-sm ${
              activeTab === "transcript" ? "bg-cyan-400 text-slate-950" : "text-slate-300"
            }`}
            onClick={() => setActiveTab("transcript")}
            type="button"
          >
            Transcript
          </button>
        </div>
      </div>

      {activeTab === "thoughts" ? (
        <div className="mt-6 grid gap-4">
          {insightCards.map((card) => (
            <article key={card.id} className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
              <p className="text-sm font-medium text-white">{card.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{card.summary}</p>

              <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-200">
                {card.points.map((point) => (
                  <li key={point} className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
                    {point}
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:border-cyan-300/40 hover:text-cyan-200"
                  href={card.threadUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Show original thread
                </a>

                {card.commentUrl ? (
                  <a
                    className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100 transition hover:bg-cyan-400/20"
                    href={card.commentUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {card.commentLabel ?? "Open original comment"}
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-3xl border border-white/10 bg-slate-950/60 p-5 text-sm leading-7 text-slate-300">
          {episode.transcriptText}
        </div>
      )}
    </section>
  );
}
