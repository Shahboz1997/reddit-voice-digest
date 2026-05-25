interface LiveOnAirBadgeProps {
  active?: boolean;
  className?: string;
}

export function LiveOnAirBadge({ active = true, className = "" }: LiveOnAirBadgeProps) {
  return (
    <div
      aria-live="polite"
      className={`live-badge radio-glass pointer-events-none fixed top-4 right-4 z-50 flex items-center gap-2.5 rounded-full px-3.5 py-2 sm:top-6 sm:right-6 ${className}`}
    >
      <span aria-hidden className={`live-dot ${active ? "live-dot--pulse" : ""}`} />
      <span className="font-display text-[10px] font-black uppercase tracking-[0.28em] text-white sm:text-[11px]">
        Live: Reddit Digest
      </span>
    </div>
  );
}
