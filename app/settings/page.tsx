import Link from "next/link";

import { AuthHeader } from "@/components/auth-header";
import { BrandMark } from "@/components/brand-mark";
import { PodcastSetupGuide } from "@/components/podcast-setup-guide";
import { SettingsForm } from "@/components/settings-form";
import {
  availableSubreddits,
  defaultNotificationPreferences,
  defaultSubredditPreferences,
} from "@/lib/catalog";
import { publicEnv } from "@/lib/config";

export default function SettingsPage() {
  return (
    <main className="app-ui mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <BrandMark />
        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          <AuthHeader />
          <Link
            className="inline-flex rounded-full border border-[var(--app-border)] px-4 py-2 text-sm font-bold text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface-elevated)] hover:text-[var(--app-text)]"
            href="/"
          >
            Home
          </Link>
        </div>
      </header>

      <SettingsForm
        availableSources={availableSubreddits}
        defaultNotifications={defaultNotificationPreferences}
        defaultSubreddits={defaultSubredditPreferences}
        rssUrl={`${publicEnv.NEXT_PUBLIC_APP_URL}/api/podcast/feed`}
      />

      <PodcastSetupGuide rssUrl={`${publicEnv.NEXT_PUBLIC_APP_URL}/api/podcast/feed`} />
    </main>
  );
}
