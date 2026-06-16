"use client";

import { ArchiveSidebar } from "@/components/archive-sidebar";
import { AudioPlayer } from "@/components/audio-player";
import { PlayerShell } from "@/components/player-shell";
import type { DigestEpisode } from "@/lib/types";

interface ArchivePageClientProps {
  episodes: DigestEpisode[];
  rssUrl: string;
}

export function ArchivePageClient({ episodes, rssUrl }: ArchivePageClientProps) {
  const latestEpisode = episodes[0];

  const player =
    latestEpisode != null ? (
      <AudioPlayer
        audioUrl={latestEpisode.audioUrl}
        chapters={latestEpisode.chapters}
        durationSeconds={latestEpisode.durationSeconds}
        episodeSlug={latestEpisode.slug}
        nowPlayingTitle={latestEpisode.title}
        playlistItems={latestEpisode.items}
        variant="spotify"
      />
    ) : null;

  return (
    <PlayerShell player={player} rssUrl={rssUrl}>
      <div className="mx-auto max-w-2xl space-y-4">
        <header className="spotify-panel px-5 py-5 sm:px-6">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Archive</h1>
          <p className="mt-1 text-sm text-white/50">Past digests and RSS feed.</p>
        </header>

        <ArchiveSidebar
          activeEpisodeId={latestEpisode?.id}
          episodes={episodes}
          rssUrl={rssUrl}
          variant="spotify"
        />
      </div>
    </PlayerShell>
  );
}
