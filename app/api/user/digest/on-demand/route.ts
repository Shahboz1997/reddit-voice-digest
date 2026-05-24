import { NextResponse } from "next/server";
import { z } from "zod";

import { defaultSubredditPreferences } from "@/lib/catalog";
import { hasSupabaseAdminEnv, hasSupabaseBrowserEnv } from "@/lib/config";
import { normalizeElevenLabsVoiceIdInput } from "@/lib/elevenlabs/voices";
import { notifyUserChannels } from "@/lib/delivery/notify-user-channels";
import { enqueuePipelineJob, getPipelineJobById } from "@/lib/pipeline/jobs";
import { runDigestPipeline } from "@/lib/pipeline/run-digest-pipeline";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { PersonaId, SummaryDepthId } from "@/lib/types";

/** On-demand digest for the signed-in user (outside scheduled cron). */
export const maxDuration = 300;

const requestSchema = z.object({
  redditPostReference: z.string().trim().min(3).optional(),
  episodeMode: z.enum(["multi", "single_thread"]).optional(),
  async: z.boolean().optional(),
});

export async function POST(request: Request) {
  if (!hasSupabaseBrowserEnv()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 400 });
  }

  if (!hasSupabaseAdminEnv()) {
    return NextResponse.json(
      { error: "Server is missing the service role key — the pipeline cannot save the digest." },
      { status: 503 },
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = requestSchema.safeParse(await request.json().catch(() => ({})));
  const options = body.success ? body.data : {};

  const [prefsRes, profileRes, subsRes] = await Promise.all([
    supabase
      .from("user_preferences")
      .select("selected_subreddits, voice, elevenlabs_voice_id, summary_depth")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("user_profile_settings")
      .select("persona, summary_depth")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("user_subreddit_preferences")
      .select("subreddit_name, sort_order")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true }),
  ]);

  if (prefsRes.error || profileRes.error || subsRes.error) {
    return NextResponse.json({ error: "Could not read settings." }, { status: 500 });
  }

  const fromPrefs = prefsRes.data?.selected_subreddits?.filter(Boolean) ?? [];
  const legacyOrder = [...(subsRes.data ?? [])]
    .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0))
    .map((r) => r.subreddit_name);

  const selectedSubreddits =
    fromPrefs.length > 0 ? fromPrefs : legacyOrder.length > 0 ? legacyOrder : defaultSubredditPreferences;

  if (!selectedSubreddits.length && !options.redditPostReference) {
    return NextResponse.json(
      { error: "Select at least one subreddit in settings or provide a Reddit thread URL." },
      { status: 400 },
    );
  }

  const persona =
    ((prefsRes.data?.voice as PersonaId) ?? (profileRes.data?.persona as PersonaId)) ?? "news_anchor";
  const summaryDepth =
    ((prefsRes.data?.summary_depth as SummaryDepthId) ??
      (profileRes.data?.summary_depth as SummaryDepthId)) ??
    "standard";

  const episodeMode =
    options.episodeMode ?? (options.redditPostReference ? "single_thread" : undefined);

  const pipelinePayload = {
    selectedSubreddits,
    persona,
    summaryDepth,
    elevenlabsVoiceId: normalizeElevenLabsVoiceIdInput(prefsRes.data?.elevenlabs_voice_id),
    ownerUserId: user.id,
    redditPostReference: options.redditPostReference ?? null,
    episodeMode,
    maxThreadsPerDigest: episodeMode === "single_thread" ? 1 : undefined,
  };

  const admin = createAdminSupabaseClient();

  if (options.async) {
    const job = await enqueuePipelineJob(admin, pipelinePayload);
    return NextResponse.json({
      ok: true,
      queued: true,
      jobId: job.id,
      status: job.status,
    });
  }

  try {
    const result = await runDigestPipeline({
      runDate: new Date(),
      selectedSubreddits,
      persona,
      summaryDepth,
      elevenlabsVoiceId: normalizeElevenLabsVoiceIdInput(prefsRes.data?.elevenlabs_voice_id),
      ownerUserId: user.id,
      redditPostReference: options.redditPostReference,
      episodeMode,
      maxThreadsPerDigest: episodeMode === "single_thread" ? 1 : undefined,
    });

    const { data: digestRow } = await admin
      .from("digests")
      .select("title, slug, summary_text")
      .eq("id", result.digestId)
      .maybeSingle();

    const notifyStatus = digestRow
      ? await notifyUserChannels(user.id, {
          title: digestRow.title,
          slug: digestRow.slug,
          summaryText: digestRow.summary_text ?? "",
          audioUrl: result.audioUrl,
        }).catch(() => ({ telegram: "failed" as const }))
      : null;

    return NextResponse.json({
      ok: true,
      result: {
        digestId: result.digestId,
        title: result.title,
        slug: result.slug,
        publishedAt: result.publishedAt,
        audioUrl: result.audioUrl,
        notify: notifyStatus,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Pipeline error.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const jobId = new URL(request.url).searchParams.get("jobId");
  if (!jobId) {
    return NextResponse.json({ error: "jobId is required." }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const admin = createAdminSupabaseClient();
  const job = await getPipelineJobById(admin, jobId, user.id);

  if (!job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, job });
}
