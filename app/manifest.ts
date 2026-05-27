import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Reddit Voice Digest",
    short_name: "RVD",
    description: "Turn long Reddit threads into short daily audio digests.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1db954",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
