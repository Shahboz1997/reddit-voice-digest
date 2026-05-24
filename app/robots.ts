import type { MetadataRoute } from "next";

import { publicEnv } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = publicEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/digest/"],
      disallow: ["/api/", "/settings"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
