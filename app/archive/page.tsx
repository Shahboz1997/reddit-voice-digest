import { ArchivePageClient } from "@/components/archive-page-client";
import { publicEnv } from "@/lib/config";
import { getPublishedDigests } from "@/lib/data/digests";

export default async function ArchivePage() {
  const episodes = await getPublishedDigests();

  return (
    <ArchivePageClient
      episodes={episodes}
      rssUrl={`${publicEnv.NEXT_PUBLIC_APP_URL}/api/podcast/feed`}
    />
  );
}
