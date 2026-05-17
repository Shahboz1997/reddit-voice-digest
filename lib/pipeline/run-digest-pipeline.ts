import { availableSubreddits } from "@/lib/catalog";
import { getServerEnv } from "@/lib/config";
import { depthCommentSampleCount, personaTtsVoice } from "@/lib/digest-persona";
import { formatDigestDate } from "@/lib/date";
import type { ChapterMarker } from "@/lib/audio/types";
import {
  renderDialogueEpisodeWithChapters,
  renderMonologueEpisodeWithChapters,
} from "@/lib/audio/render-episode";
import { generateDigestScript, summarizeThread } from "@/lib/openai/client";
import { redditSummariesToDialogue } from "@/src/lib/ai-engine";
import { fetchThreadComments, fetchTopThreads, type RedditComment, type RedditThread } from "@/lib/reddit/client";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { PersonaId, SummaryDepthId } from "@/lib/types";
const MIN_COMMENTS_PRIMARY = 100;
const MIN_COMMENTS_FALLBACK = 30;
const DEFAULT_THREADS_PER_SOURCE = 8;
const MAX_THREADS_PER_DIGEST = 3;

interface SourceRow {
  id: string;
  subreddit_name: string;
  priority: number;
}

interface PersistedThreadRow {
  id: string;
  reddit_post_id: string;
}

interface PipelineOptions {
  runDate?: Date;
  selectedSubreddits?: string[];
  threadsPerSource?: number;
  maxThreadsPerDigest?: number;
  persona?: PersonaId;
  summaryDepth?: SummaryDepthId;
  elevenlabsVoiceId?: string | null;
  ownerUserId?: string | null;
}

interface SummarizedThread {
  thread: RedditThread;
  comments: RedditComment[];
  whyItMatters: string;
  summary: string;
  keyTakeaways: string[];
}

export interface PipelineRunResult {
  digestId: string;
  title: string;
  slug: string;
  publishedAt: string;
  selectedSubreddits: string[];
  audioPath: string;
  audioUrl: string;
}

export async function runDigestPipeline(options: PipelineOptions = {}): Promise<PipelineRunResult> {
  const env = getServerEnv();
  const supabase = createAdminSupabaseClient();
  const runDate = options.runDate ?? new Date();
  const runDateKey = runDate.toISOString().slice(0, 10);
  const runDateLabel = formatDigestDate(runDate.toISOString(), {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const maxThreads = options.maxThreadsPerDigest ?? MAX_THREADS_PER_DIGEST;
  const threadsPerSource = options.threadsPerSource ?? DEFAULT_THREADS_PER_SOURCE;
  const persona = options.persona ?? "news_anchor";
  const summaryDepth = options.summaryDepth ?? "standard";
  const digestRun = await upsertDigestRun(supabase, runDateKey);

  try {
    const sources = await loadSources(supabase, options.selectedSubreddits);
    const selectedSubreddits = sources.map((source) => source.subreddit_name);
    const processedPostIds = await loadProcessedRedditPostIds(supabase);
    const candidateThreads = await fetchThreadsPrioritized(
      selectedSubreddits,
      threadsPerSource,
      maxThreads,
      processedPostIds,
    );
    const finalThreads = candidateThreads.filter((thread) => !processedPostIds.has(thread.redditPostId));

    if (!finalThreads.length) {
      throw new Error(
        candidateThreads.length
          ? "All candidate Reddit threads were already processed. Try again tomorrow or reset is_processed for testing."
          : "No Reddit threads met the minimum comment threshold for digest generation.",
      );
    }

    const commentBudget = depthCommentSampleCount(summaryDepth);

    const persistedThreads = await persistThreads(supabase, finalThreads, sources);
    const summarizedThreads = await Promise.all(
      finalThreads.map(async (thread) => {
        const comments = (
          await fetchThreadComments(thread.redditPostId, Math.max(commentBudget + 12, 32))
        ).slice(0, commentBudget);

        if (!comments.length) {
          throw new Error(`No usable comments returned for Reddit post ${thread.redditPostId}.`);
        }

        const summary = await summarizeThread({
          subreddit: thread.subredditName,
          title: thread.title,
          body: thread.selftext || thread.title,
          comments: comments.map((comment) => comment.body),
          persona,
          summaryDepth,
        });

        await persistComments(supabase, persistedThreads.get(thread.redditPostId) ?? "", thread, comments);

        return {
          thread,
          comments,
          whyItMatters: summary.why_it_matters,
          summary: summary.summary,
          keyTakeaways: summary.key_takeaways.slice(0, 3),
        } satisfies SummarizedThread;
      }),
    );

    const scriptItems = summarizedThreads.map((item, index) => ({
      title: item.thread.title,
      subreddit: item.thread.subredditName,
      whyItMatters: item.whyItMatters,
      summary: item.summary,
      keyTakeaways: item.keyTakeaways,
      segmentWeightPrimary: index === 0,
    }));

    const useDialogue = env.DIGEST_SCRIPT_MODE === "dialogue";

    let digestScript: {
      digest_title: string;
      intro: string;
      closing: string;
      full_script: string;
    };
    let audioBuffer: Buffer;
    let measuredDurationSeconds: number;
    let chapterMarkers: ChapterMarker[] = [];
    const voice = personaTtsVoice(persona, env.AUDIO_PROVIDER, options.elevenlabsVoiceId);

    if (useDialogue) {
      const dialogue = await redditSummariesToDialogue({
        dateLabel: runDateLabel,
        persona,
        summaryDepth,
        items: scriptItems,
      });
      digestScript = dialogue;
      const rendered = await renderDialogueEpisodeWithChapters({
        intro: dialogue.intro,
        turns: dialogue.turns,
        closing: dialogue.closing,
        threadCount: summarizedThreads.length,
        renderOpts: {
          persona,
          elevenlabsVoiceOverride: options.elevenlabsVoiceId,
        },
      });
      audioBuffer = rendered.buffer;
      measuredDurationSeconds = rendered.durationSeconds;
      chapterMarkers = rendered.chapterMarkers;
    } else {
      digestScript = await generateDigestScript({
        dateLabel: runDateLabel,
        persona,
        summaryDepth,
        items: scriptItems,
      });
      const rendered = await renderMonologueEpisodeWithChapters({
        intro: digestScript.intro,
        closing: digestScript.closing,
        items: scriptItems,
        persona,
        voice,
        elevenlabsVoiceOverride: options.elevenlabsVoiceId,
      });
      audioBuffer = rendered.buffer;
      measuredDurationSeconds = rendered.durationSeconds;
      chapterMarkers = rendered.chapterMarkers;
    }
    const ownerPart = options.ownerUserId ? `-${options.ownerUserId.replace(/-/g, "").slice(0, 8)}` : "";
    const audioPath = `${runDateKey}/main${ownerPart}.mp3`;
    const audioUrl = await uploadDigestAudio(supabase, env.SUPABASE_STORAGE_BUCKET, audioPath, audioBuffer);

    const slug = `main-insights-from-reddit-${runDateKey}${ownerPart}`;
    const digestId = await persistDigest(
      supabase,
      digestRun.id,
      slug,
      digestScript,
      audioPath,
      audioUrl,
      summarizedThreads,
      persistedThreads,
      measuredDurationSeconds,
      chapterMarkers,
      options.ownerUserId ?? undefined,
    );

    await markThreadsProcessed(supabase, [...persistedThreads.values()]);
    await markDigestRunCompleted(supabase, digestRun.id);
    await logJob(supabase, "completed", {
      digestId,
      slug,
      runDate: runDateKey,
      selectedSubreddits,
      audioPath,
    });

    return {
      digestId,
      title: digestScript.digest_title,
      slug,
      publishedAt: new Date().toISOString(),
      selectedSubreddits,
      audioPath,
      audioUrl,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown pipeline error.";
    await markDigestRunFailed(supabase, digestRun.id, message);
    await logJob(supabase, "failed", {
      runDate: runDateKey,
      error: message,
    });
    throw error;
  }
}

async function loadSources(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  selectedSubreddits?: string[],
) {
  let query = supabase
    .from("sources")
    .select("id, subreddit_name, priority")
    .eq("is_active", true)
    .order("priority", { ascending: false });

  if (selectedSubreddits?.length) {
    query = query.in("subreddit_name", selectedSubreddits);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load sources from Supabase: ${error.message}`);
  }

  const sourceRows = (data ?? []) as SourceRow[];

  if (sourceRows.length) {
    if (selectedSubreddits?.length) {
      const orderMap = new Map(selectedSubreddits.map((name, idx) => [name.toLowerCase(), idx]));
      sourceRows.sort(
        (a, b) =>
          (orderMap.get(a.subreddit_name.toLowerCase()) ?? 999) -
          (orderMap.get(b.subreddit_name.toLowerCase()) ?? 999),
      );
    }
    return sourceRows;
  }

  const fallbackRows = availableSubreddits
    .filter((item) => item.is_active)
    .filter((item) => !selectedSubreddits?.length || selectedSubreddits.includes(item.subreddit_name))
    .map((item) => ({
      id: crypto.randomUUID(),
      subreddit_name: item.subreddit_name,
      priority: item.priority,
    }));

  if (selectedSubreddits?.length) {
    const orderMap = new Map(selectedSubreddits.map((name, idx) => [name.toLowerCase(), idx]));
    fallbackRows.sort(
      (a, b) =>
        (orderMap.get(a.subreddit_name.toLowerCase()) ?? 999) -
        (orderMap.get(b.subreddit_name.toLowerCase()) ?? 999),
    );
  }

  return fallbackRows;
}

async function loadProcessedRedditPostIds(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
): Promise<Set<string>> {
  const { data, error } = await supabase.from("threads").select("reddit_post_id").eq("is_processed", true);

  if (error) {
    throw new Error(`Failed to load processed threads: ${error.message}`);
  }

  return new Set((data ?? []).map((row) => row.reddit_post_id as string));
}

async function markThreadsProcessed(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  threadIds: string[],
) {
  if (!threadIds.length) {
    return;
  }

  const { error } = await supabase
    .from("threads")
    .update({
      is_processed: true,
      processed_at: new Date().toISOString(),
    })
    .in("id", threadIds);

  if (error) {
    throw new Error(`Failed to mark threads processed: ${error.message}`);
  }
}

async function fetchThreadsPrioritized(
  orderedSubreddits: string[],
  threadsPerSource: number,
  maxThreads: number,
  skipPostIds: Set<string> = new Set(),
): Promise<RedditThread[]> {
  const threadGroups = await Promise.all(
    orderedSubreddits.map((subreddit) => fetchTopThreads(subreddit, threadsPerSource)),
  );

  const buckets = threadGroups.map((threads) =>
    [...threads].sort((left, right) => right.rankingScore - left.rankingScore),
  );

  const picked: RedditThread[] = [];
  const taken = new Set<string>();

  const qualifies = (thread: RedditThread, strict: boolean) =>
    strict ? thread.numComments >= MIN_COMMENTS_PRIMARY : thread.numComments >= MIN_COMMENTS_FALLBACK;

  function sweep(strict: boolean) {
    for (let round = 0; round < threadsPerSource && picked.length < maxThreads; round++) {
      for (let bi = 0; bi < buckets.length && picked.length < maxThreads; bi++) {
        const thread = buckets[bi][round];
        if (
          !thread ||
          taken.has(thread.redditPostId) ||
          skipPostIds.has(thread.redditPostId) ||
          !qualifies(thread, strict)
        ) {
          continue;
        }

        picked.push(thread);
        taken.add(thread.redditPostId);
      }
    }
  }

  sweep(true);
  if (picked.length < maxThreads) {
    sweep(false);
  }

  if (!picked.length) {
    const flat = buckets.flat().sort((left, right) => right.rankingScore - left.rankingScore);

    for (const thread of flat) {
      if (picked.length >= maxThreads) {
        break;
      }

      if (
        taken.has(thread.redditPostId) ||
        skipPostIds.has(thread.redditPostId) ||
        thread.numComments < MIN_COMMENTS_FALLBACK
      ) {
        continue;
      }

      picked.push(thread);
      taken.add(thread.redditPostId);
    }
  }

  return picked.slice(0, maxThreads);
}

async function persistThreads(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  threads: RedditThread[],
  sources: SourceRow[],
) {
  const sourceMap = new Map(sources.map((source) => [source.subreddit_name.toLowerCase(), source.id]));
  const payload = threads.map((thread) => ({
    reddit_post_id: thread.redditPostId,
    source_id: sourceMap.get(thread.subredditName.toLowerCase()) ?? null,
    title: thread.title,
    author_name: thread.authorName,
    subreddit_name: thread.subredditName,
    url: thread.url,
    permalink: thread.permalink,
    score: thread.score,
    num_comments: thread.numComments,
    created_utc: new Date(thread.createdUtc * 1000).toISOString(),
    selftext: thread.selftext,
    ranking_score: thread.rankingScore,
    raw_json: {
      reddit_post_id: thread.redditPostId,
      subreddit_name: thread.subredditName,
      title: thread.title,
      author_name: thread.authorName,
    },
  }));

  const { data, error } = await supabase
    .from("threads")
    .upsert(payload, { onConflict: "reddit_post_id" })
    .select("id, reddit_post_id");

  if (error) {
    throw new Error(`Failed to persist Reddit threads: ${error.message}`);
  }

  return new Map(
    ((data ?? []) as PersistedThreadRow[]).map((row) => [row.reddit_post_id, row.id]),
  );
}

async function persistComments(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  threadId: string,
  thread: RedditThread,
  comments: RedditComment[],
) {
  if (!threadId) {
    throw new Error(`Thread ID is missing while persisting comments for ${thread.redditPostId}.`);
  }

  const payload = comments.map((comment, index) => ({
    thread_id: threadId,
    reddit_comment_id: comment.redditCommentId,
    parent_reddit_id: thread.redditPostId,
    author_name: comment.authorName,
    body: comment.body,
    score: comment.score,
    depth: comment.depth,
    is_op: comment.isOp,
    selected_for_summary: index < 5,
    raw_json: {
      reddit_comment_id: comment.redditCommentId,
      reddit_post_id: thread.redditPostId,
      subreddit_name: thread.subredditName,
    },
  }));

  const { error } = await supabase.from("comments").upsert(payload, {
    onConflict: "reddit_comment_id",
  });

  if (error) {
    throw new Error(`Failed to persist Reddit comments: ${error.message}`);
  }
}

async function persistDigest(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  digestRunId: string,
  slug: string,
  digestScript: {
    digest_title: string;
    intro: string;
    closing: string;
    full_script: string;
  },
  audioPath: string,
  audioUrl: string,
  summarizedThreads: SummarizedThread[],
  persistedThreads: Map<string, string>,
  measuredDurationSeconds: number,
  chapterMarkers: ChapterMarker[],
  ownerUserId?: string | null,
) {
  const publishedAt = new Date().toISOString();
  const topics = summarizedThreads.map((item) => mapSubredditToTopic(item.thread.subredditName));
  const summaryText = summarizedThreads.map((item) => item.summary).join("\n\n");

  const { data: digestRow, error: digestError } = await supabase
    .from("digests")
    .upsert(
      {
        digest_run_id: digestRunId,
        owner_user_id: ownerUserId ?? null,
        title: digestScript.digest_title,
        slug,
        intro_text: digestScript.intro,
        summary_text: summaryText,
        script_text: digestScript.full_script,
        transcript_text: digestScript.full_script,
        topics,
        audio_url: audioUrl,
        audio_storage_path: audioPath,
        duration_seconds: Math.max(1, Math.round(measuredDurationSeconds)),
        published_at: publishedAt,
      },
      { onConflict: "slug" },
    )
    .select("id")
    .single();

  if (digestError || !digestRow) {
    throw new Error(`Failed to persist digest row: ${digestError?.message ?? "Missing digest row."}`);
  }

  const markerByThread = new Map(chapterMarkers.map((marker) => [marker.threadIndex, marker]));
  const fallbackSlice = Math.max(
    30,
    Math.floor(measuredDurationSeconds / Math.max(summarizedThreads.length, 1)),
  );

  let fallbackCursor = 0;
  const digestItemsPayload = summarizedThreads.map((item, index) => {
    const marker = markerByThread.get(index);
    const startSeconds = marker ? Math.round(marker.startSeconds) : fallbackCursor;
    const endSeconds = marker
      ? Math.round(marker.endSeconds)
      : fallbackCursor + fallbackSlice;
    if (!marker) {
      fallbackCursor = endSeconds;
    }
    const topComment = item.comments[0];

    return {
      digest_id: digestRow.id,
      thread_id: persistedThreads.get(item.thread.redditPostId) ?? null,
      position: index + 1,
      thread_summary: item.summary,
      key_takeaways: item.keyTakeaways,
      tldr_points: item.keyTakeaways,
      why_it_matters: item.whyItMatters,
      reddit_thread_url: item.thread.permalink,
      reddit_comment_url: topComment ? `${item.thread.permalink}${topComment.redditCommentId}/` : null,
      audio_start_seconds: startSeconds,
      audio_end_seconds: Math.max(startSeconds + 1, endSeconds),
    };
  });

  const { error: deleteItemsError } = await supabase
    .from("digest_items")
    .delete()
    .eq("digest_id", digestRow.id);

  if (deleteItemsError) {
    throw new Error(`Failed to refresh digest items: ${deleteItemsError.message}`);
  }

  const { error: insertItemsError } = await supabase.from("digest_items").insert(digestItemsPayload);

  if (insertItemsError) {
    throw new Error(`Failed to persist digest items: ${insertItemsError.message}`);
  }

  return digestRow.id;
}

async function uploadDigestAudio(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  bucketName: string,
  path: string,
  audioBuffer: Buffer,
) {
  await ensureStorageBucket(supabase, bucketName);

  const { error } = await supabase.storage.from(bucketName).upload(path, audioBuffer, {
    contentType: "audio/mpeg",
    upsert: true,
  });

  if (error) {
    throw new Error(`Failed to upload digest audio: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucketName).getPublicUrl(path);

  return publicUrl;
}

async function ensureStorageBucket(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  bucketName: string,
) {
  const { error: createError } = await supabase.storage.createBucket(bucketName, {
    public: true,
    allowedMimeTypes: ["audio/mpeg"],
    fileSizeLimit: "50MB",
  });

  if (createError && !createError.message.toLowerCase().includes("already exists")) {
    throw new Error(`Failed to create storage bucket: ${createError.message}`);
  }

  const { error: updateError } = await supabase.storage.updateBucket(bucketName, {
    public: true,
    allowedMimeTypes: ["audio/mpeg"],
    fileSizeLimit: "50MB",
  });

  if (updateError && !updateError.message.toLowerCase().includes("not found")) {
    throw new Error(`Failed to update storage bucket visibility: ${updateError.message}`);
  }
}

async function upsertDigestRun(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  runDate: string,
) {
  const { data, error } = await supabase
    .from("digest_runs")
    .upsert(
      {
        run_date: runDate,
        status: "processing",
        started_at: new Date().toISOString(),
        completed_at: null,
        error_message: null,
      },
      { onConflict: "run_date" },
    )
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Failed to upsert digest run: ${error?.message ?? "Missing digest run row."}`);
  }

  return data;
}

async function markDigestRunCompleted(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  digestRunId: string,
) {
  const { error } = await supabase
    .from("digest_runs")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      error_message: null,
    })
    .eq("id", digestRunId);

  if (error) {
    throw new Error(`Failed to mark digest run completed: ${error.message}`);
  }
}

async function markDigestRunFailed(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  digestRunId: string,
  errorMessage: string,
) {
  await supabase
    .from("digest_runs")
    .update({
      status: "failed",
      completed_at: new Date().toISOString(),
      error_message: errorMessage,
    })
    .eq("id", digestRunId);
}

async function logJob(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  status: string,
  response: Record<string, unknown>,
) {
  await supabase.from("job_logs").insert({
    job_name: "daily-pipeline",
    status,
    payload: {},
    response,
  });
}

function mapSubredditToTopic(subredditName: string) {
  const normalized = subredditName.toLowerCase();

  if (normalized === "personalfinance") {
    return "finance";
  }

  if (normalized === "entrepreneur") {
    return "startups";
  }

  if (normalized === "futurology") {
    return "ai";
  }

  return normalized;
}
