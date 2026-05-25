import { publicEnv } from "@/lib/config";
import { getPublishedDigests, getPublishedDigestsForOwner } from "@/lib/data/digests";
import type { DigestEpisode } from "@/lib/types";
import {
  assemblePodcastRssXml,
  canonicalPodcastGuidForFeed,
  isPlayablePodcastEpisode,
  mergedPublicPodcastChannel,
} from "@/lib/podcast/feed-xml";
import type { PodcastChannelOptions } from "@/lib/podcast/rss";

export interface PodcastFeedResponseOptions {
  feedUrl: string;
  channel?: Partial<
    Omit<PodcastChannelOptions, "baseUrl" | "feedUrl" | "podcastGuid">
  >;
  ownerUserId?: string;
  cacheControl?: string;
}

function sortEpisodesNewestFirst(episodes: DigestEpisode[]) {
  return [...episodes].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

export async function buildPodcastFeedResponse(options: PodcastFeedResponseOptions) {
  const baseUrl = publicEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const episodes = options.ownerUserId
    ? await getPublishedDigestsForOwner(options.ownerUserId)
    : await getPublishedDigests();

  const playable = episodes.filter(isPlayablePodcastEpisode);
  const rssOrder = sortEpisodesNewestFirst(playable);

  const channel = mergedPublicPodcastChannel({
    baseUrl,
    feedUrl: options.feedUrl,
    podcastGuid: canonicalPodcastGuidForFeed(options.feedUrl),
    ...options.channel,
  });

  const xml = await assemblePodcastRssXml(rssOrder, channel);

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": options.cacheControl ?? "public, s-maxage=300, stale-while-revalidate=86400",
    },
  });
}
