import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: "/rss/:token.xml", destination: "/rss/:token" },
      { source: "/api/podcast/feed.xml", destination: "/api/podcast/feed" },
    ];
  },
};

export default nextConfig;
