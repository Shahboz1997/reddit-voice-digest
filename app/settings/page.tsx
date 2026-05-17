import Link from "next/link";

import { AuthHeader } from "@/components/auth-header";
import { BrandMark } from "@/components/brand-mark";
import { SettingsForm } from "@/components/settings-form";
import {
  availableSubreddits,
  defaultNotificationPreferences,
  defaultSubredditPreferences,
} from "@/lib/catalog";
import { publicEnv } from "@/lib/config";

export default function SettingsPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
      <header className="radio-glass flex flex-col gap-5 rounded-2xl px-6 py-5 md:flex-row md:items-center md:justify-between">
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

      <SettingsForm
        availableSources={availableSubreddits}
        defaultNotifications={defaultNotificationPreferences}
        defaultSubreddits={defaultSubredditPreferences}
        rssUrl={`${publicEnv.NEXT_PUBLIC_APP_URL}/api/podcast/feed`}
      />
    </main>
  );
}
