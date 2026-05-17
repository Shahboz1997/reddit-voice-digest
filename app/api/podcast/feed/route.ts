import { publicEnv } from "@/lib/config";
import { buildPodcastFeedResponse } from "@/lib/podcast/serve-feed";

/**
 * Public podcast RSS for Apple Podcasts / Spotify «Add by RSS».
 * Subscribe URL: {NEXT_PUBLIC_APP_URL}/api/podcast/feed
 */
export const dynamic = "force-dynamic";

export const runtime = "nodejs";

export async function GET() {
  const baseUrl = publicEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");

  return buildPodcastFeedResponse({
    feedUrl: `${baseUrl}/api/podcast/feed`,
    channel: {
      podcastTitle: "Reddit Voice Digest",
      podcastSubtitle: "Reddit threads, distilled into a short daily listen.",
      podcastSummary:
        "Two hosts unpack the best practical advice from massive Reddit threads — add this URL in Apple Podcasts or any RSS player.",
    },
  });
}
