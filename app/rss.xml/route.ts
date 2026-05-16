import { publicEnv } from "@/lib/config";
import { getPublishedDigests } from "@/lib/data/digests";
import type { DigestEpisode } from "@/lib/types";
import {
  assemblePodcastRssXml,
  canonicalPodcastGuidForFeed,
  isPlayablePodcastEpisode,
  mergedPublicPodcastChannel,
} from "@/lib/podcast/feed-xml";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

function hasPlayableAudioUrl(episode: DigestEpisode): episode is DigestEpisode & { audioUrl: string } {
  return isPlayablePodcastEpisode(episode);
}

export async function GET() {
  const baseUrl = publicEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const feedUrl = `${baseUrl}/rss.xml`;

  const all = await getPublishedDigests();
  const playable = all.filter(hasPlayableAudioUrl);

  const rssOrder = [...playable].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  const podcastGuid = canonicalPodcastGuidForFeed(feedUrl);

  const channel = mergedPublicPodcastChannel({
    baseUrl,
    feedUrl,
    podcastGuid,
  });

  const xml = await assemblePodcastRssXml(rssOrder, channel);

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
    },
  });
}
