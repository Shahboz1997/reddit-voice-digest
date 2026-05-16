import { publicEnv } from "@/lib/config";
import { getPublishedDigestsForOwner } from "@/lib/data/digests";
import {
  assemblePodcastRssXml,
  canonicalPodcastGuidForFeed,
  isPlayablePodcastEpisode,
  mergedPublicPodcastChannel,
} from "@/lib/podcast/feed-xml";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

/** Personal podcast feed: `/rss/:uuid` or `/rss/:uuid.xml` (rewrite). */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  const raw = (await context.params).token;
  const token = raw.replace(/\.xml$/i, "");

  if (!UUID_RE.test(token)) {
    return new Response("Invalid feed token.", { status: 404 });
  }

  let supabase;

  try {
    supabase = createAdminSupabaseClient();
  } catch {
    return new Response("Server not configured.", { status: 503 });
  }

  const { data: row, error } = await supabase
    .from("user_profile_settings")
    .select("user_id")
    .eq("rss_feed_token", token)
    .maybeSingle();

  if (error || !row?.user_id) {
    return new Response("Feed not found.", { status: 404 });
  }

  const episodes = await getPublishedDigestsForOwner(row.user_id);
  const playable = episodes.filter(isPlayablePodcastEpisode);

  const baseUrl = publicEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const feedUrl = `${baseUrl}/rss/${token}.xml`;
  const channel = mergedPublicPodcastChannel({
    baseUrl,
    feedUrl,
    podcastGuid: canonicalPodcastGuidForFeed(feedUrl),
    podcastTitle: "Reddit Voice Digest — ваш подбор",
    podcastSubtitle: "Персональные выпуски с вашими сабреддитами",
    podcastSummary:
      "Этот фид синхронизируется только с персональными дайджестами вашего аккаунта — добавьте ссылку в Apple Podcasts или Spotify.",
  });

  const xml = await assemblePodcastRssXml(playable, channel);

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "private, s-maxage=120, stale-while-revalidate=3600",
    },
  });
}
