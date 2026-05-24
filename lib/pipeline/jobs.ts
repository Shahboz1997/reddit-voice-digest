import type { PersonaId, SummaryDepthId } from "@/lib/types";
import type { createAdminSupabaseClient } from "@/lib/supabase/admin";

import { runDigestPipeline, type PipelineRunResult } from "@/lib/pipeline/run-digest-pipeline";

export type PipelineJobStatus = "queued" | "running" | "completed" | "failed";

export interface PipelineJobPayload {
  selectedSubreddits?: string[];
  persona?: PersonaId;
  summaryDepth?: SummaryDepthId;
  elevenlabsVoiceId?: string | null;
  ownerUserId?: string | null;
  redditPostReference?: string | null;
  episodeMode?: "multi" | "single_thread";
  maxThreadsPerDigest?: number;
}

export async function enqueuePipelineJob(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  payload: PipelineJobPayload,
) {
  const { data, error } = await supabase
    .from("pipeline_jobs")
    .insert({
      status: "queued",
      owner_user_id: payload.ownerUserId ?? null,
      payload,
    })
    .select("id, status, created_at")
    .single();

  if (error || !data) {
    throw new Error(`Failed to enqueue pipeline job: ${error?.message ?? "Missing row."}`);
  }

  return data;
}

export async function claimNextPipelineJob(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
) {
  const { data: candidates, error } = await supabase
    .from("pipeline_jobs")
    .select("id, payload, owner_user_id")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(1);

  if (error) {
    throw new Error(`Failed to load queued pipeline jobs: ${error.message}`);
  }

  const candidate = candidates?.[0];
  if (!candidate) {
    return null;
  }

  const { data: claimed, error: claimError } = await supabase
    .from("pipeline_jobs")
    .update({
      status: "running",
      started_at: new Date().toISOString(),
      error_message: null,
    })
    .eq("id", candidate.id)
    .eq("status", "queued")
    .select("id, payload, owner_user_id")
    .maybeSingle();

  if (claimError) {
    throw new Error(`Failed to claim pipeline job: ${claimError.message}`);
  }

  return claimed;
}

export async function completePipelineJob(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  jobId: string,
  result: PipelineRunResult,
) {
  const { error } = await supabase
    .from("pipeline_jobs")
    .update({
      status: "completed",
      result,
      completed_at: new Date().toISOString(),
      error_message: null,
    })
    .eq("id", jobId);

  if (error) {
    throw new Error(`Failed to complete pipeline job: ${error.message}`);
  }
}

export async function failPipelineJob(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  jobId: string,
  errorMessage: string,
) {
  await supabase
    .from("pipeline_jobs")
    .update({
      status: "failed",
      completed_at: new Date().toISOString(),
      error_message: errorMessage,
    })
    .eq("id", jobId);
}

export async function runClaimedPipelineJob(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  job: { id: string; payload: PipelineJobPayload; owner_user_id: string | null },
) {
  const payload = job.payload ?? {};
  const episodeMode = payload.episodeMode ?? "multi";

  try {
    const result = await runDigestPipeline({
      selectedSubreddits: payload.selectedSubreddits,
      persona: payload.persona,
      summaryDepth: payload.summaryDepth,
      elevenlabsVoiceId: payload.elevenlabsVoiceId,
      ownerUserId: payload.ownerUserId ?? job.owner_user_id ?? undefined,
      redditPostReference: payload.redditPostReference ?? undefined,
      episodeMode,
      maxThreadsPerDigest:
        payload.maxThreadsPerDigest ?? (episodeMode === "single_thread" ? 1 : undefined),
    });

    await completePipelineJob(supabase, job.id, result);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown pipeline error.";
    await failPipelineJob(supabase, job.id, message);
    throw error;
  }
}

export async function getPipelineJobById(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  jobId: string,
  ownerUserId?: string | null,
) {
  let query = supabase
    .from("pipeline_jobs")
    .select("id, status, payload, result, error_message, created_at, started_at, completed_at")
    .eq("id", jobId);

  if (ownerUserId) {
    query = query.eq("owner_user_id", ownerUserId);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    throw new Error(`Failed to load pipeline job: ${error.message}`);
  }

  return data;
}
