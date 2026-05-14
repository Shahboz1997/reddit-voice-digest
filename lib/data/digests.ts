import { hasSupabaseAdminEnv } from "@/lib/config";
import { demoEpisodes } from "@/lib/demo-data";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { DigestEpisode, DigestItem } from "@/lib/types";

interface DigestRow {
  id: string;
  slug: string;
  title: string;
  intro_text: string;
  summary_text: string;
  transcript_text: string;
  audio_url: string | null;
  duration_seconds: number | null;
  published_at: string | null;
  topics: unknown;
}

interface DigestItemRow {
  id: string;
  digest_id: string;
  thread_id: string | null;
  position: number;
  thread_summary: string;
  key_takeaways: unknown;
  tldr_points: unknown;
  why_it_matters: string;
  reddit_thread_url: string | null;
  reddit_comment_url: string | null;
  audio_start_seconds: number;
  audio_end_seconds: number | null;
}

interface ThreadRow {
  id: string;
  title: string;
  subreddit_name: string;
}

export async function getPublishedDigests() {
  if (!hasSupabaseAdminEnv()) {
    return demoEpisodes;
  }

  try {
    const supabase = createAdminSupabaseClient();
    const { data: digests, error: digestsError } = await supabase
      .from("digests")
      .select(
        "id, slug, title, intro_text, summary_text, transcript_text, audio_url, duration_seconds, published_at, topics",
      )
      .is("owner_user_id", null)
      .not("published_at", "is", null)
      .order("published_at", { ascending: false });

    if (digestsError || !(digests ?? []).length) {
      return demoEpisodes;
    }

    const digestIds = (digests as DigestRow[]).map((digest) => digest.id);
    const { data: digestItems, error: digestItemsError } = await supabase
      .from("digest_items")
      .select(
        "id, digest_id, thread_id, position, thread_summary, key_takeaways, tldr_points, why_it_matters, reddit_thread_url, reddit_comment_url, audio_start_seconds, audio_end_seconds",
      )
      .in("digest_id", digestIds)
      .order("position", { ascending: true });

    if (digestItemsError) {
      return demoEpisodes;
    }

    const threadIds = Array.from(
      new Set(
        ((digestItems ?? []) as DigestItemRow[])
          .map((item) => item.thread_id)
          .filter((threadId): threadId is string => Boolean(threadId)),
      ),
    );

    const { data: threads } = threadIds.length
      ? await supabase.from("threads").select("id, title, subreddit_name").in("id", threadIds)
      : { data: [] as ThreadRow[] };

    const threadMap = new Map(((threads ?? []) as ThreadRow[]).map((thread) => [thread.id, thread]));

    return (digests as DigestRow[]).map((digest) => mapDigestRowToEpisode(digest, digestItems as DigestItemRow[], threadMap));
  } catch {
    return demoEpisodes;
  }
}

export async function getPublishedDigestBySlug(slug: string) {
  const digests = await getPublishedDigests();
  return digests.find((digest) => digest.slug === slug) ?? null;
}

function mapDigestRowToEpisode(
  digest: DigestRow,
  digestItems: DigestItemRow[],
  threadMap: Map<string, ThreadRow>,
): DigestEpisode {
  const items = digestItems
    .filter((item) => item.digest_id === digest.id)
    .sort((left, right) => left.position - right.position)
    .map((item) => mapDigestItem(item, threadMap));

  const durationSeconds = digest.duration_seconds ?? 300;
  const keyThoughts = items.flatMap((item) => item.tldrPoints).slice(0, 5);

  return {
    id: digest.id,
    slug: digest.slug,
    title: digest.title,
    summary: digest.summary_text,
    introText: digest.intro_text,
    transcriptText: digest.transcript_text,
    audioUrl: digest.audio_url ?? "",
    publishedAt: digest.published_at ?? new Date().toISOString(),
    durationSeconds,
    durationLabel: `${Math.max(1, Math.round(durationSeconds / 60))} min`,
    topics: toStringArray(digest.topics),
    keyThoughts,
    chapters: items.map((item, index) => ({
      id: `${digest.id}-chapter-${index + 1}`,
      label: item.threadTitle,
      startSeconds: item.startSeconds,
      endSeconds: item.endSeconds,
      summary: item.summary,
    })),
    items,
  };
}

function mapDigestItem(item: DigestItemRow, threadMap: Map<string, ThreadRow>): DigestItem {
  const thread = item.thread_id ? threadMap.get(item.thread_id) : undefined;

  return {
    id: item.id,
    threadTitle: thread?.title ?? `Thread ${item.position}`,
    subredditName: thread?.subreddit_name ?? "reddit",
    whyItMatters: item.why_it_matters,
    summary: item.thread_summary,
    keyTakeaways: toStringArray(item.key_takeaways),
    tldrPoints: toStringArray(item.tldr_points),
    startSeconds: item.audio_start_seconds,
    endSeconds: item.audio_end_seconds ?? item.audio_start_seconds + 90,
    redditThreadUrl: item.reddit_thread_url ?? "https://www.reddit.com",
    redditCommentUrl: item.reddit_comment_url ?? undefined,
    commentCtaLabel: item.reddit_comment_url ? "Open original comment" : undefined,
  };
}

function toStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}
