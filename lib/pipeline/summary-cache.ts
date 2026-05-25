import type { PersonaId, SummaryDepthId } from "@/lib/types";
import type { createAdminSupabaseClient } from "@/lib/supabase/admin";

import { hashCommentSample } from "@/lib/reddit/noise-filter";
import type { RedditComment } from "@/lib/reddit/client";

export interface CachedThreadSummary {
  why_it_matters: string;
  summary: string;
  key_takeaways: string[];
}

export function buildSummaryCacheKey(input: {
  redditPostId: string;
  persona: PersonaId;
  summaryDepth: SummaryDepthId;
  comments: RedditComment[];
}) {
  return {
    reddit_post_id: input.redditPostId,
    persona: input.persona,
    summary_depth: input.summaryDepth,
    content_hash: hashCommentSample(input.comments),
  };
}

export async function loadCachedThreadSummary(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  cacheKey: ReturnType<typeof buildSummaryCacheKey>,
): Promise<CachedThreadSummary | null> {
  const { data, error } = await supabase
    .from("thread_summary_cache")
    .select("why_it_matters, summary, key_takeaways")
    .eq("reddit_post_id", cacheKey.reddit_post_id)
    .eq("persona", cacheKey.persona)
    .eq("summary_depth", cacheKey.summary_depth)
    .eq("content_hash", cacheKey.content_hash)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const takeaways = Array.isArray(data.key_takeaways)
    ? data.key_takeaways.filter((item): item is string => typeof item === "string")
    : [];

  return {
    why_it_matters: data.why_it_matters as string,
    summary: data.summary as string,
    key_takeaways: takeaways,
  };
}

export async function saveCachedThreadSummary(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  cacheKey: ReturnType<typeof buildSummaryCacheKey>,
  summary: CachedThreadSummary,
) {
  await supabase.from("thread_summary_cache").upsert(
    {
      reddit_post_id: cacheKey.reddit_post_id,
      persona: cacheKey.persona,
      summary_depth: cacheKey.summary_depth,
      content_hash: cacheKey.content_hash,
      why_it_matters: summary.why_it_matters,
      summary: summary.summary,
      key_takeaways: summary.key_takeaways,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "reddit_post_id,persona,summary_depth,content_hash" },
  );
}
