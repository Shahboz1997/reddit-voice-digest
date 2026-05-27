"use client";

import { useEffect } from "react";

import { MobileBottomSheet } from "@/components/mobile-bottom-sheet";
import { SubredditArt } from "@/components/subreddit-art";
import { IconClose, IconExternal } from "@/lib/ui-icons";
import type { DigestItem } from "@/lib/types";

interface ThreadDetailDrawerProps {
  item: DigestItem | null;
  onClose: () => void;
}

function ThreadDetailHeader({ item, onClose }: { item: DigestItem; onClose: () => void }) {
  return (
    <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--app-border)] px-4 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <SubredditArt size="md" subredditName={item.subredditName} />
        <p className="truncate font-display text-xs font-bold uppercase tracking-wider text-[var(--radio-yellow)]">
          r/{item.subredditName}
        </p>
      </div>
      <button
        aria-label="Close"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white"
        onClick={onClose}
        type="button"
      >
        <IconClose className="h-5 w-5" />
      </button>
    </header>
  );
}

function ThreadDetailBody({ item }: { item: DigestItem }) {
  return (
    <>
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
        className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--radio-pink)]/15 px-4 text-sm font-medium text-[var(--radio-pink)] transition hover:bg-[var(--radio-pink)]/25"
        href={item.redditThreadUrl}
        rel="noreferrer"
        target="_blank"
      >
        <IconExternal className="h-4 w-4" />
        Reddit
      </a>
    </>
  );
}

export function ThreadDetailDrawer({ item, onClose }: ThreadDetailDrawerProps) {
  useEffect(() => {
    if (!item) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [item, onClose]);

  if (!item) {
    return null;
  }

  return (
    <>
      <MobileBottomSheet ariaLabel="Thread details" onClose={onClose} open>
        <ThreadDetailHeader item={item} onClose={onClose} />
        <div className="flex-1 overflow-y-auto p-4">
          <ThreadDetailBody item={item} />
        </div>
      </MobileBottomSheet>

      <button
        aria-label="Close"
        className="fixed inset-0 z-40 hidden bg-black/60 backdrop-blur-sm sm:block"
        onClick={onClose}
        type="button"
      />
      <aside
        className="insight-drawer app-ui fixed inset-y-0 right-0 z-50 hidden w-full max-w-md flex-col border-l border-[var(--app-border)] bg-[var(--app-surface)] shadow-2xl backdrop-blur-xl sm:flex"
        role="dialog"
      >
        <ThreadDetailHeader item={item} onClose={onClose} />
        <div className="flex-1 overflow-y-auto p-4">
          <ThreadDetailBody item={item} />
        </div>
      </aside>
    </>
  );
}
