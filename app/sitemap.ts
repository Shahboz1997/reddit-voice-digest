import type { MetadataRoute } from "next";

import { publicEnv } from "@/lib/config";
import { getPublishedDigests } from "@/lib/data/digests";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = publicEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const episodes = await getPublishedDigests();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/settings`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  const episodeRoutes: MetadataRoute.Sitemap = episodes.map((episode) => ({
    url: `${baseUrl}/digest/${episode.slug}`,
    lastModified: episode.publishedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...episodeRoutes];
}
