"use client";

import { useEffect, type ReactNode } from "react";

interface MobileBottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  labelledBy?: string;
  ariaLabel?: string;
  className?: string;
}

export function MobileBottomSheet({
  open,
  onClose,
  children,
  labelledBy,
  ariaLabel,
  className = "",
}: MobileBottomSheetProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <>
      <button
        aria-label="Close"
        className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm sm:hidden"
        onClick={onClose}
        type="button"
      />
      <div
        aria-label={ariaLabel}
        aria-labelledby={labelledBy}
        className={`mobile-bottom-sheet app-ui fixed inset-x-0 bottom-0 z-[60] flex max-h-[min(90dvh,720px)] flex-col rounded-t-2xl border border-[var(--app-border)] bg-[var(--app-surface)] pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-2xl sm:hidden ${className}`}
        role="dialog"
      >
        <div className="flex shrink-0 justify-center pt-2 pb-1" aria-hidden>
          <div className="h-1 w-10 rounded-full bg-[var(--app-border)]" />
        </div>
        {children}
      </div>
    </>
  );
}
