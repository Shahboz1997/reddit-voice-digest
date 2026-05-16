import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [{ source: "/rss/:token.xml", destination: "/rss/:token" }];
  },
};

export default nextConfig;
