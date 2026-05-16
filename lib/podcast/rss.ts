import type { DigestEpisode } from "@/lib/types";

export function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

/** Apple Podcasts / iTunes duration (mm:ss or h:mm:ss). */
export function formatItunesDuration(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function guessAudioMimeType(audioUrl: string): string {
  const path = audioUrl.split("?")[0]?.toLowerCase() ?? "";
  if (path.endsWith(".mp3")) {
    return "audio/mpeg";
  }
  if (path.endsWith(".m4a") || path.endsWith(".aac") || path.endsWith(".mp4")) {
    return "audio/mp4";
  }
  if (path.endsWith(".wav")) {
    return "audio/wav";
  }
  if (path.endsWith(".ogg")) {
    return "audio/ogg";
  }
  return "audio/mpeg";
}

export interface PodcastEpisodeRssPayload {
  episode: DigestEpisode & { audioUrl: string };
  episodeNumber: number;
  guid: string;
  pageUrl: string;
  enclosureLengthBytes?: number;
}

export interface PodcastChannelOptions {
  baseUrl: string;
  /** Full URL of this RSS document (Atom self link). */
  feedUrl: string;
  podcastTitle?: string;
  podcastSubtitle?: string;
  podcastSummary?: string;
  author?: string;
  explicit?: "yes" | "no";
  language?: string;
  /** Primary category displayed in directories (nested subcategory omitted for simplicity). */
  itunesCategory?: string;
  imageUrlAbsolute?: string;
  ownerName?: string;
  ownerEmail?: string;
  /** Podcasting 2.0 / Spotify-compatible show GUID (RFC 4122-style). */
  podcastGuid: string;
}

function channelBlock(opts: PodcastChannelOptions, lastBuildXml: string) {
  const title = escapeXml(opts.podcastTitle ?? "Reddit Voice Digest");
  const link = escapeXml(opts.baseUrl);
  const desc = escapeXml(opts.podcastSummary ?? opts.podcastSubtitle ?? "Short daily Reddit thread digests in audio.");
  const subtitle = escapeXml(opts.podcastSubtitle ?? "Reddit threads, distilled for your ears.");
  const author = escapeXml(opts.author ?? "Reddit Voice Digest");
  const explicit = opts.explicit ?? "no";
  const lang = opts.language ?? "en-us";
  const category = escapeXml(opts.itunesCategory ?? "Technology");

  const imageLine = opts.imageUrlAbsolute
    ? `    <itunes:image href="${escapeXml(opts.imageUrlAbsolute)}" />`
    : "";

  const ownerBlock =
    opts.ownerEmail && opts.ownerName
      ? `    <itunes:owner>
      <itunes:name>${escapeXml(opts.ownerName)}</itunes:name>
      <itunes:email>${escapeXml(opts.ownerEmail)}</itunes:email>
    </itunes:owner>`
      : "";

  const pg = escapeXml(opts.podcastGuid);

  return `
  <channel>
    <title>${title}</title>
    <podcast:guid>${pg}</podcast:guid>
    <link>${link}</link>
    <description>${desc}</description>
    ${lastBuildXml}
    <language>${lang}</language>
    <generator>reddit-voice-digest</generator>
    <atom:link href="${escapeXml(opts.feedUrl)}" rel="self" type="application/rss+xml" />
    <itunes:explicit>${explicit}</itunes:explicit>
    <itunes:type>episodic</itunes:type>
    <itunes:author>${author}</itunes:author>
    <itunes:title>${title}</itunes:title>
    <itunes:subtitle>${subtitle}</itunes:subtitle>
    <itunes:summary>${desc}</itunes:summary>
${imageLine}
${ownerBlock}
    <itunes:category text="${category}" />`;
}

function itemsBlock(entries: PodcastEpisodeRssPayload[]) {
  const lines: string[] = [];

  for (const row of entries) {
    const e = row.episode;
    const audioUrl = e.audioUrl.trim();
    const mime = guessAudioMimeType(audioUrl);
    const lengthAttr =
      row.enclosureLengthBytes !== undefined &&
      Number.isFinite(row.enclosureLengthBytes) &&
      row.enclosureLengthBytes > 0
        ? ` length="${row.enclosureLengthBytes}"`
        : "";

    const fullDesc =
      `${e.introText.trim()}\n\n${e.summary}`.trim().slice(0, 15000) || e.summary;
    const description = escapeXml(fullDesc);

    const enclosure = `<enclosure url="${escapeXml(audioUrl)}" type="${escapeXml(mime)}"${lengthAttr} />`;
    const episodeUrl = escapeXml(row.pageUrl);
    const pubDate = new Date(e.publishedAt).toUTCString();
    const duration = formatItunesDuration(e.durationSeconds);

    lines.push(`
    <item>
      <title>${escapeXml(e.title)}</title>
      <link>${episodeUrl}</link>
      <guid isPermalink="true">${escapeXml(row.guid)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${description}</description>
      ${enclosure}
      <itunes:episode>${row.episodeNumber}</itunes:episode>
      <itunes:title>${escapeXml(e.title)}</itunes:title>
      <itunes:summary>${escapeXml(e.introText.trim() ? `${e.introText.trim()}\n\n${e.summary}` : e.summary)}</itunes:summary>
      <itunes:explicit>no</itunes:explicit>
      <itunes:duration>${duration}</itunes:duration>
      <content:encoded><![CDATA[<p>${escapeHtmlCdata(e.introText)}</p><p>${escapeHtmlCdata(e.summary)}</p><p><a href="${escapeHtmlCdata(row.pageUrl)}">Episode page</a></p>]]></content:encoded>
    </item>`);
  }

  return lines.join("\n");
}

function escapeHtmlCdata(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/**
 * Builds an Apple-compatible podcast RSS document.
 * Include only payloads where `episode.audioUrl` is a usable HTTP(S) URL.
 */
export function buildApplePodcastRss(payload: {
  episodes: PodcastEpisodeRssPayload[];
  channel: PodcastChannelOptions;
}): string {
  const lastBuild = new Date().toUTCString();
  const channelStart = channelBlock(payload.channel, `    <lastBuildDate>${escapeXml(lastBuild)}</lastBuildDate>`);
  const items = itemsBlock(payload.episodes);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:podcast="https://podcastindex.org/namespace/1.0"
  version="2.0"
>
${channelStart}
${items}
  </channel>
</rss>`;

  return xml.trimStart();
}

export function normalizeAbsoluteAssetUrl(baseUrl: string, value: string) {
  const trimmed = value.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const origin = baseUrl.replace(/\/$/, "");
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${origin}${path}`;
}
