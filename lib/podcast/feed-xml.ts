import { publicEnv } from "@/lib/config";
import type { DigestEpisode } from "@/lib/types";

import {
  buildApplePodcastRss,
  normalizeAbsoluteAssetUrl,
  type PodcastChannelOptions,
  type PodcastEpisodeRssPayload,
} from "@/lib/podcast/rss";
import { podcastGuidForCanonicalFeed } from "@/lib/podcast/stable-guid";

import { probeEnclosureBytes } from "./probe-enclosure";

/** HTTP(S) URL with trimmed non-empty pathname (query allowed). */
export const PODCAST_AUDIO_URL_RE = /^https?:\/\/.+/i;

export function isPlayablePodcastEpisode(episode: DigestEpisode): episode is DigestEpisode & { audioUrl: string } {
  const u = episode.audioUrl?.trim();
  return Boolean(u && PODCAST_AUDIO_URL_RE.test(u));
}

export async function assemblePodcastRssXml(
  episodes: DigestEpisode[],
  channel: PodcastChannelOptions,
): Promise<string> {
  const baseUrl = channel.baseUrl.replace(/\/$/, "");
  const playableEpisodes = episodes.filter(isPlayablePodcastEpisode);

  const chronological = [...playableEpisodes].sort(
    (a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime(),
  );

  const episodeNumberBySlug = new Map<string, number>();
  chronological.forEach((ep, idx) => {
    episodeNumberBySlug.set(ep.slug, idx + 1);
  });

  const rssOrder = [...playableEpisodes].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  const probeByUrl = new Map<string, number | undefined>();
  const uniqueUrls = [...new Set(rssOrder.map((ep) => ep.audioUrl.trim()))];
  await Promise.all(
    uniqueUrls.map(async (audioUrl) => {
      const bytes = await probeEnclosureBytes(audioUrl);
      probeByUrl.set(audioUrl, bytes);
    }),
  );

  const payloads: PodcastEpisodeRssPayload[] = rssOrder.map((episode) => {
    const audioUrl = episode.audioUrl.trim();
    return {
      episode,
      episodeNumber: episodeNumberBySlug.get(episode.slug) ?? 1,
      guid: `${baseUrl}/digest/${episode.slug}`,
      pageUrl: `${baseUrl}/digest/${episode.slug}`,
      enclosureLengthBytes: probeByUrl.get(audioUrl),
    };
  });

  return buildApplePodcastRss({
    channel,
    episodes: payloads,
  });
}

export function mergedPublicPodcastChannel(
  base: Omit<Partial<PodcastChannelOptions>, "baseUrl" | "feedUrl" | "podcastGuid"> &
    Pick<PodcastChannelOptions, "baseUrl" | "feedUrl" | "podcastGuid">,
): PodcastChannelOptions {
  const imageFromEnv = publicEnv.NEXT_PUBLIC_PODCAST_IMAGE_URL?.trim();
  const imageUrlAbsolute = imageFromEnv ? normalizeAbsoluteAssetUrl(base.baseUrl, imageFromEnv) : undefined;

  const ownerEmail = process.env.PODCAST_OWNER_EMAIL?.trim();
  const ownerName = process.env.PODCAST_OWNER_NAME?.trim();

  return {
    baseUrl: base.baseUrl,
    feedUrl: base.feedUrl,
    podcastGuid: base.podcastGuid,
    podcastTitle: base.podcastTitle ?? "Reddit Voice Digest",
    podcastSubtitle: base.podcastSubtitle ?? "Reddit threads, distilled into a short listen.",
    podcastSummary:
      base.podcastSummary ??
      "Daily short podcast episodes summarizing standout Reddit discussions—built for commuters and doomscrolling recovery.",
    author: base.author ?? process.env.PODCAST_AUTHOR?.trim() ?? "Reddit Voice Digest",
    imageUrlAbsolute: base.imageUrlAbsolute ?? imageUrlAbsolute,
    explicit: base.explicit ?? "no",
    language: base.language ?? "en-us",
    itunesCategory: base.itunesCategory ?? "Technology",
    ownerEmail: base.ownerEmail ?? (ownerEmail || undefined),
    ownerName:
      base.ownerName ?? ownerName ?? (ownerEmail ? "Reddit Voice Digest" : undefined),
  };
}

export function canonicalPodcastGuidForFeed(feedUrl: string): string {
  return podcastGuidForCanonicalFeed(feedUrl, process.env.PODCAST_SHOW_GUID);
}
