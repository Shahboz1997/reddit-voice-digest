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
 * URL не требует cookies — удобно для плееров. Менее приватно, чем `/rss/{rss_feed_token}.xml`.
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
    podcastTitle: "Reddit Voice Digest — ваш подбор",
    podcastSubtitle: "Подкаст-фид по выпускам пользователя",
    podcastSummary:
      "Фид по UUID аккаунта: только опубликованные персональные выпуски этого пользователя. Для большей приватности используйте секретный адрес /rss/{token}.xml из профиля.",
  });

  const xml = await assemblePodcastRssXml(playable, channel);

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "private, s-maxage=120, stale-while-revalidate=3600",
    },
  });
}
