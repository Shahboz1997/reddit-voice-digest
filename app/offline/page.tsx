import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
      <BrandMark />
      <h1 className="mt-8 text-2xl font-bold text-[var(--app-text)]">You&apos;re offline</h1>
      <p className="mt-3 text-sm leading-relaxed text-[var(--app-text-muted)]">
        Reddit Voice Digest needs a connection to load new episodes. Cached pages may still open when you
        return online.
      </p>
      <Link
        className="mt-8 inline-flex rounded-full bg-[var(--accent-primary)] px-6 py-3 text-sm font-bold text-[var(--accent-on-primary)] transition hover:bg-[var(--accent-primary-hover)]"
        href="/"
      >
        Try again
      </Link>
    </main>
  );
}
