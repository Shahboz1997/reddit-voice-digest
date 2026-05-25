interface PodcastSetupGuideProps {
  rssUrl: string;
}

export function PodcastSetupGuide({ rssUrl }: PodcastSetupGuideProps) {
  return (
    <section className="radio-glass rounded-2xl border border-white/10 p-6">
      <p className="font-display text-[10px] font-bold uppercase tracking-[0.45em] text-[var(--radio-yellow)]">
        Podcast apps
      </p>
      <h2 className="mt-3 text-2xl font-semibold text-white">Add your personal feed</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
        Paste your personal RSS URL into any podcast app. New digests appear automatically when
        your lineup is generated.
      </p>

      <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
        <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">Your RSS feed</p>
        <p className="mt-2 break-all font-mono text-sm text-slate-100">{rssUrl}</p>
      </div>

      <ol className="mt-6 space-y-4 text-sm leading-7 text-slate-300">
        <li>
          <span className="font-semibold text-white">Apple Podcasts:</span> Library → Follow a Show
          by URL → paste the RSS link above.
        </li>
        <li>
          <span className="font-semibold text-white">Spotify:</span> Settings → Add podcast by RSS
          feed (where available) → paste the same URL.
        </li>
        <li>
          <span className="font-semibold text-white">Pocket Casts / Overcast:</span> Add show by URL
          and paste the RSS link.
        </li>
      </ol>

      <p className="mt-5 text-xs text-slate-400">
        For Apple Podcasts directory submission, set a square cover image via{" "}
        <code className="rounded bg-white/5 px-1.5 py-0.5">NEXT_PUBLIC_PODCAST_IMAGE_URL</code> in
        production.
      </p>
    </section>
  );
}
