"use client";

import { SubredditArt } from "@/components/subreddit-art";
import { IconClose, IconExternal } from "@/lib/ui-icons";
import type { DigestItem } from "@/lib/types";

interface ThreadDetailDrawerProps {
  item: DigestItem | null;
  onClose: () => void;
}

export function ThreadDetailDrawer({ item, onClose }: ThreadDetailDrawerProps) {
  if (!item) {
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
        className="insight-drawer fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-white/10 bg-[#0a0a0a]/95 shadow-2xl backdrop-blur-xl"
        role="dialog"
      >
        <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <SubredditArt size="md" subredditName={item.subredditName} />
            <p className="truncate font-display text-xs font-bold uppercase tracking-wider text-[var(--radio-yellow)]">
              r/{item.subredditName}
            </p>
          </div>
          <button
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white"
            onClick={onClose}
            type="button"
          >
            <IconClose className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          <h2 className="text-lg font-semibold text-white">{item.threadTitle}</h2>
          <p className="mt-3 text-sm leading-6 text-white/55">{item.summary}</p>

          <ul className="mt-4 space-y-2">
            {item.keyTakeaways.map((takeaway) => (
              <li key={takeaway} className="rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-white/75">
                {takeaway}
              </li>
            ))}
          </ul>

          <a
            className="mt-6 inline-flex h-10 items-center gap-2 rounded-full bg-[var(--radio-pink)]/15 px-4 text-sm font-medium text-[var(--radio-pink)] transition hover:bg-[var(--radio-pink)]/25"
            href={item.redditThreadUrl}
            rel="noreferrer"
            target="_blank"
          >
            <IconExternal className="h-4 w-4" />
            Reddit
          </a>
        </div>
      </aside>
    </>
  );
}
