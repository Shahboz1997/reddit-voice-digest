import { publicEnv } from "@/lib/config";
import { buildPodcastFeedResponse } from "@/lib/podcast/serve-feed";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

export async function GET() {
  const baseUrl = publicEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");

  return buildPodcastFeedResponse({
    feedUrl: `${baseUrl}/rss.xml`,
  });
}
