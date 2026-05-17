export function BrandMark() {
  return (
    <div className="flex items-center gap-4">
      <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--radio-pink)]/15 ring-1 ring-[var(--radio-pink)]/40">
        <div className="flex h-6 items-end justify-center gap-[3px]">
          <span className="h-2 w-1 rounded-sm bg-[var(--radio-pink)]" />
          <span className="h-4 w-1 rounded-sm bg-[var(--radio-pink)]" />
          <span className="h-3 w-1 rounded-sm bg-[var(--radio-yellow)]" />
          <span className="h-5 w-1 rounded-sm bg-[var(--radio-yellow)]" />
        </div>
      </div>

      <div>
        <p className="font-display text-xs font-black uppercase tracking-[0.32em] text-[var(--radio-pink)]">
          Reddit Voice Digest
        </p>
        <p className="mt-0.5 font-display text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
          Dance radio for reddit threads
        </p>
      </div>
    </div>
  );
}
