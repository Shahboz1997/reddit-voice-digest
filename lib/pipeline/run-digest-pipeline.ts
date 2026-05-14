import { availableSubreddits } from "@/lib/catalog";
import { getServerEnv } from "@/lib/config";
import { formatDigestDate } from "@/lib/date";
import { renderPodcastAudio } from "@/lib/audio/provider";
import { generateDigestScript, summarizeThread } from "@/lib/openai/client";
import { fetchThreadComments, fetchTopThreads, type RedditComment, type RedditThread } from "@/lib/reddit/client";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const DIGEST_DURATION_SECONDS = 300;
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

  const digestRun = await upsertDigestRun(supabase, runDateKey);

  try {
    const sources = await loadSources(supabase, options.selectedSubreddits);
    const selectedSubreddits = sources.map((source) => source.subreddit_name);
    const rankedThreads = await fetchRankedThreads(selectedSubreddits, threadsPerSource);
    const candidateThreads = rankedThreads
      .filter((thread) => thread.numComments >= MIN_COMMENTS_PRIMARY)
      .slice(0, maxThreads);
    const finalThreads =
      candidateThreads.length >= maxThreads
        ? candidateThreads
        : rankedThreads.filter((thread) => thread.numComments >= MIN_COMMENTS_FALLBACK).slice(0, maxThreads);

    if (!finalThreads.length) {
      throw new Error("No Reddit threads met the minimum comment threshold for digest generation.");
    }

    const persistedThreads = await persistThreads(supabase, finalThreads, sources);
    const summarizedThreads = await Promise.all(
      finalThreads.map(async (thread) => {
        const comments = (await fetchThreadComments(thread.redditPostId, 20)).slice(0, 10);

        if (!comments.length) {
          throw new Error(`No usable comments returned for Reddit post ${thread.redditPostId}.`);
        }

        const summary = await summarizeThread({
          subreddit: thread.subredditName,
          title: thread.title,
          body: thread.selftext || thread.title,
          comments: comments.map((comment) => comment.body),
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

    const digestScript = await generateDigestScript({
      dateLabel: runDateLabel,
      items: summarizedThreads.map((item) => ({
        title: item.thread.title,
        subreddit: item.thread.subredditName,
        whyItMatters: item.whyItMatters,
        summary: item.summary,
        keyTakeaways: item.keyTakeaways,
      })),
    });

    const audioBuffer = await renderPodcastAudio(digestScript.full_script);
    const audioPath = `${runDateKey}/main.mp3`;
    const audioUrl = await uploadDigestAudio(supabase, env.SUPABASE_STORAGE_BUCKET, audioPath, audioBuffer);

    const slug = `main-insights-from-reddit-${runDateKey}`;
    const digestId = await persistDigest(
      supabase,
      digestRun.id,
      slug,
      digestScript,
      audioPath,
      audioUrl,
      summarizedThreads,
      persistedThreads,
    );

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
    return sourceRows;
  }

  return availableSubreddits
    .filter((item) => item.is_active)
    .filter((item) => !selectedSubreddits?.length || selectedSubreddits.includes(item.subreddit_name))
    .map((item) => ({
      id: crypto.randomUUID(),
      subreddit_name: item.subreddit_name,
      priority: item.priority,
    }));
}

async function fetchRankedThreads(subreddits: string[], threadsPerSource: number) {
  const threadGroups = await Promise.all(
    subreddits.map((subreddit) => fetchTopThreads(subreddit, threadsPerSource)),
  );

  return threadGroups
    .flat()
    .sort((left, right) => right.rankingScore - left.rankingScore)
    .filter(
      (thread, index, threads) =>
        threads.findIndex((candidate) => candidate.redditPostId === thread.redditPostId) === index,
    );
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
) {
  const publishedAt = new Date().toISOString();
  const topics = summarizedThreads.map((item) => mapSubredditToTopic(item.thread.subredditName));
  const summaryText = summarizedThreads.map((item) => item.summary).join("\n\n");

  const { data: digestRow, error: digestError } = await supabase
    .from("digests")
    .upsert(
      {
        digest_run_id: digestRunId,
        title: digestScript.digest_title,
        slug,
        intro_text: digestScript.intro,
        summary_text: summaryText,
        script_text: digestScript.full_script,
        transcript_text: digestScript.full_script,
        topics,
        audio_url: audioUrl,
        audio_storage_path: audioPath,
        duration_seconds: DIGEST_DURATION_SECONDS,
        published_at: publishedAt,
      },
      { onConflict: "slug" },
    )
    .select("id")
    .single();

  if (digestError || !digestRow) {
    throw new Error(`Failed to persist digest row: ${digestError?.message ?? "Missing digest row."}`);
  }

  const chapterDuration = Math.floor(DIGEST_DURATION_SECONDS / summarizedThreads.length);
  const digestItemsPayload = summarizedThreads.map((item, index) => {
    const startSeconds = index * chapterDuration;
    const endSeconds = index === summarizedThreads.length - 1 ? DIGEST_DURATION_SECONDS : (index + 1) * chapterDuration;
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
      audio_end_seconds: endSeconds,
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
