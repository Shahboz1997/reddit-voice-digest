import { publicEnv } from "@/lib/config";
import { getPublishedDigestsForOwner } from "@/lib/data/digests";
import {
  assemblePodcastRssXml,
  canonicalPodcastGuidForFeed,
  isPlayablePodcastEpisode,
  mergedPublicPodcastChannel,
} from "@/lib/podcast/feed-xml";

/**
 * Per-account RSS by Auth UUID (`GET /api/rss/{uuid}`).
 * URL does not require cookies — convenient for players. Less private than `/rss/{rss_feed_token}.xml`.
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  const raw = (await context.params).userId;
  const userId = raw.replace(/\.xml$/i, "");

  if (!UUID_RE.test(userId)) {
    return new Response("Invalid user id.", { status: 404 });
  }

  const episodesList = await getPublishedDigestsForOwner(userId);
  const playable = episodesList.filter(isPlayablePodcastEpisode);

  const baseUrl = publicEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const feedUrl = `${baseUrl}/api/rss/${userId}`;
  const channel = mergedPublicPodcastChannel({
    baseUrl,
    feedUrl,
    podcastGuid: canonicalPodcastGuidForFeed(feedUrl),
    podcastTitle: "Reddit Voice Digest — your lineup",
    podcastSubtitle: "Podcast feed for this user's episodes",
    podcastSummary:
      "Feed by account UUID: only published personal episodes for this user. For more privacy, use the secret /rss/{token}.xml URL from your profile.",
  });

  const xml = await assemblePodcastRssXml(playable, channel);

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "private, s-maxage=120, stale-while-revalidate=3600",
    },
  });
}
