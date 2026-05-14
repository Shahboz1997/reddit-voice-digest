export function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/15 ring-1 ring-cyan-300/20">
        <div className="absolute h-6 w-6 rounded-full border border-cyan-300/40" />
        <div className="absolute h-3 w-3 rounded-full bg-cyan-300" />
        <div className="absolute left-1 top-3 h-1.5 w-1.5 rounded-full bg-cyan-200" />
        <div className="absolute right-1 top-3 h-1.5 w-1.5 rounded-full bg-cyan-200" />
      </div>

      <div>
        <p className="text-sm uppercase tracking-[0.28em] text-cyan-300">Reddit Voice Digest</p>
        <p className="text-sm text-slate-300">Minimal daily podcast for long threads</p>
      </div>
    </div>
  );
}
