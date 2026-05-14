import { demoEpisodes } from "@/lib/demo-data";
import { publicEnv } from "@/lib/config";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET() {
  const baseUrl = publicEnv.NEXT_PUBLIC_APP_URL;
  const items = demoEpisodes
    .map((episode) => {
      const episodeUrl = `${baseUrl}/digest/${episode.slug}`;
      const enclosure = episode.audioUrl
        ? `<enclosure url="${escapeXml(episode.audioUrl)}" type="audio/mpeg" />`
        : "";

      return `
        <item>
          <title>${escapeXml(episode.title)}</title>
          <link>${escapeXml(episodeUrl)}</link>
          <guid>${escapeXml(episodeUrl)}</guid>
          <pubDate>${new Date(episode.publishedAt).toUTCString()}</pubDate>
          <description>${escapeXml(episode.summary)}</description>
          ${enclosure}
        </item>
      `;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Reddit Voice Digest</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>Daily short podcast summaries of long Reddit threads.</description>
    <language>en-us</language>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
