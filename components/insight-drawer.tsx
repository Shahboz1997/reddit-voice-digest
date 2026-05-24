"use client";

import { useState } from "react";

import { ShareInsightDialog } from "@/components/share-insight-dialog";
import { SubredditArt } from "@/components/subreddit-art";
import { IconClose, IconDocument, IconExternal, IconShare, IconTranscript } from "@/lib/ui-icons";
import type { DigestEpisode } from "@/lib/types";

interface InsightDrawerProps {
  episode: DigestEpisode;
  open: boolean;
  onClose: () => void;
}

export function InsightDrawer({ episode, open, onClose }: InsightDrawerProps) {
  if (!open) {
    return null;
  }

  return (
    <>
      <button
        aria-label="Close"
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />
      <aside
        aria-labelledby="insight-drawer-title"
        className="insight-drawer fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-white/10 bg-[#0a0a0a]/95 shadow-2xl backdrop-blur-xl"
        role="dialog"
      >
        <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4">
          <div className="flex items-center gap-2">
            <IconDocument className="h-5 w-5 text-[var(--radio-yellow)]" />
            <h2
              className="font-display text-sm font-extrabold uppercase tracking-wider text-white"
              id="insight-drawer-title"
            >
              TL;DR
            </h2>
          </div>
          <button
            aria-label="Close drawer"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white"
            onClick={onClose}
            type="button"
          >
            <IconClose className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          <InsightDrawerBody episode={episode} />
        </div>
      </aside>
    </>
  );
}

function InsightDrawerBody({ episode }: { episode: DigestEpisode }) {
  const [activeTab, setActiveTab] = useState<"thoughts" | "transcript">("thoughts");
  const [shareCardId, setShareCardId] = useState<string | null>(null);

  const insightCards = episode.items.map((item) => ({
    id: item.id,
    subredditName: item.subredditName,
    title: item.threadTitle,
    summary: item.summary,
    points: item.tldrPoints,
    threadUrl: item.redditThreadUrl,
    commentUrl: item.redditCommentUrl,
    commentLabel: item.commentCtaLabel,
  }));

  const shareCard = shareCardId ? (insightCards.find((c) => c.id === shareCardId) ?? null) : null;

  return (
    <>
      <div className="mb-4 inline-flex rounded-full border border-white/10 bg-black/50 p-1">
        <button
          aria-label="Key thoughts"
          className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
            activeTab === "thoughts" ? "bg-[var(--radio-pink)] text-black" : "text-white/50 hover:text-white"
          }`}
          onClick={() => setActiveTab("thoughts")}
          title="Key thoughts"
          type="button"
        >
          <IconDocument className="h-4 w-4" />
        </button>
        <button
          aria-label="Transcript"
          className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
            activeTab === "transcript" ? "bg-[var(--radio-pink)] text-black" : "text-white/50 hover:text-white"
          }`}
          onClick={() => setActiveTab("transcript")}
          title="Transcript"
          type="button"
        >
          <IconTranscript className="h-4 w-4" />
        </button>
      </div>

      {activeTab === "thoughts" ? (
        <ul className="space-y-3">
          {insightCards.map((card) => (
            <li key={card.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="flex gap-3">
                <SubredditArt size="sm" subredditName={card.subredditName} />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold text-white">{card.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-white/50">{card.summary}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  aria-label="Share insight"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/60 transition hover:border-[var(--radio-pink)]/40 hover:text-[var(--radio-pink)]"
                  onClick={() => setShareCardId(card.id)}
                  type="button"
                >
                  <IconShare className="h-3.5 w-3.5" />
                </button>
                <a
                  aria-label="Open Reddit thread"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/60 transition hover:text-white"
                  href={card.threadUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  <IconExternal className="h-3.5 w-3.5" />
                </a>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm leading-7 text-white/55">{episode.transcriptText}</p>
      )}

      {shareCard ? (
        <ShareInsightDialog
          key={shareCard.id}
          episodeSlug={episode.slug}
          episodeTitle={episode.title}
          onClose={() => setShareCardId(null)}
          open
          publishedAt={episode.publishedAt}
          subredditName={shareCard.subredditName}
          summary={shareCard.summary}
          threadTitle={shareCard.title}
          tldrPoints={shareCard.points}
        />
      ) : null}
    </>
  );
}
