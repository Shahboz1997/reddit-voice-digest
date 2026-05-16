import { DashboardClient } from "@/components/dashboard-client";
import { publicEnv } from "@/lib/config";
import { getPublishedDigests } from "@/lib/data/digests";

export default async function HomePage() {
  const episodes = await getPublishedDigests();

  return (
    <DashboardClient episodes={episodes} rssUrl={`${publicEnv.NEXT_PUBLIC_APP_URL}/podcast.rss`} />
  );
}
