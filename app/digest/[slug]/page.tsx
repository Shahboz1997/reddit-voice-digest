import Link from "next/link";
import { notFound } from "next/navigation";

import { AuthHeader } from "@/components/auth-header";
import { AudioPlayer } from "@/components/audio-player";
import { BrandMark } from "@/components/brand-mark";
import { KeyThoughtsPanel } from "@/components/key-thoughts-panel";
import { formatDigestDate } from "@/lib/date";
import { getPublishedDigestBySlug } from "@/lib/data/digests";

interface DigestPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function DigestPage({ params }: DigestPageProps) {
  const { slug } = await params;
  const episode = await getPublishedDigestBySlug(slug);

  if (!episode) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-10">
      <header className="flex flex-col gap-5 rounded-[2rem] border border-white/10 bg-white/5 p-6 md:flex-row md:items-center md:justify-between">
        <BrandMark />
        <div className="flex flex-wrap items-center gap-3">
          <AuthHeader />
          <Link
            className="inline-flex rounded-full border border-white/10 bg-slate-950/60 px-4 py-2 text-sm text-white transition hover:border-cyan-300/30 hover:text-cyan-200"
            href="/"
          >
            Back to dashboard
          </Link>
        </div>
      </header>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <p className="text-sm uppercase tracking-[0.28em] text-cyan-300">
          {formatDigestDate(episode.publishedAt)}
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">{episode.title}</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">{episode.introText}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          {episode.topics.map((topic) => (
            <span
              key={topic}
              className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-cyan-100"
            >
              #{topic}
            </span>
          ))}
        </div>

        <div className="mt-8 w-full">
          <AudioPlayer
            audioUrl={episode.audioUrl}
            chapters={episode.chapters}
            durationSeconds={episode.durationSeconds}
            nowPlayingTitle={episode.title}
            playlistItems={episode.items}
            variant="radio"
          />
        </div>
      </section>

      <section className="grid gap-6">
        {episode.items.map((item, index) => (
          <article key={item.id} className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.22em] text-cyan-300">
              <span>Thread {index + 1}</span>
              <span className="h-1 w-1 rounded-full bg-cyan-300" />
              <span>r/{item.subredditName}</span>
            </div>

            <h2 className="mt-4 text-2xl font-semibold text-white">{item.threadTitle}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">{item.summary}</p>
            <p className="mt-4 text-sm font-medium text-white">Why it matters</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{item.whyItMatters}</p>

            <ul className="mt-4 space-y-2 text-sm text-slate-200">
              {item.keyTakeaways.map((takeaway) => (
                <li key={takeaway} className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
                  {takeaway}
                </li>
              ))}
            </ul>

            <div className="mt-5 flex flex-wrap gap-3">
              <a
                className="inline-flex text-sm font-medium text-cyan-300 hover:text-cyan-200"
                href={item.redditThreadUrl}
                rel="noreferrer"
                target="_blank"
              >
                Open original Reddit thread
              </a>

              {item.redditCommentUrl ? (
                <a
                  className="inline-flex text-sm font-medium text-white hover:text-cyan-200"
                  href={item.redditCommentUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {item.commentCtaLabel ?? "Open original comment"}
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </section>

      <KeyThoughtsPanel episode={episode} variant="radio" />
    </main>
  );
}
