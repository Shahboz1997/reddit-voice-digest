import { createHash } from "node:crypto";

const SEED_NAMESPACE = "reddit-voice-digest:podcast-show:v1";

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Stable UUID-shaped id for Podcasting 2.0 `<podcast:guid>`.
 * Override with `PODCAST_SHOW_GUID` when you need a fixed id across domain moves.
 */
export function podcastGuidForCanonicalFeed(canonicalFeedUrl: string, overrideRaw?: string): string {
  const override = overrideRaw?.trim();
  if (override && UUID_V4_REGEX.test(override)) {
    return override.toLowerCase();
  }

  const hash = createHash("sha256").update(`${SEED_NAMESPACE}\0${canonicalFeedUrl}`).digest();
  const bytes = Buffer.from(hash.subarray(0, 16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}
