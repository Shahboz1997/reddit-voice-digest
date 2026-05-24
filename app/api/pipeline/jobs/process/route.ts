import { NextResponse } from "next/server";

import { getServerEnv, hasSupabaseAdminEnv } from "@/lib/config";
import {
  claimNextPipelineJob,
  runClaimedPipelineJob,
} from "@/lib/pipeline/jobs";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const maxDuration = 300;

function isAuthorized(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const secrets = [
    process.env.PIPELINE_CRON_SECRET,
    process.env.CRON_SECRET,
    process.env.DELIVERY_CRON_SECRET,
  ].filter(Boolean);

  return Boolean(token && secrets.includes(token));
}

export async function POST(request: Request) {
  if (!hasSupabaseAdminEnv()) {
    return NextResponse.json({ error: "Supabase admin env is missing." }, { status: 503 });
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const env = getServerEnv();
  const supabase = createAdminSupabaseClient();
  const maxJobs = Math.max(1, env.PIPELINE_JOBS_MAX_PER_TICK);
  const processed: Array<{ jobId: string; slug?: string; digestId?: string }> = [];
  const failures: Array<{ jobId: string; error: string }> = [];

  for (let i = 0; i < maxJobs; i++) {
    const job = await claimNextPipelineJob(supabase);
    if (!job) {
      break;
    }

    try {
      const result = await runClaimedPipelineJob(supabase, {
        id: job.id,
        payload: (job.payload ?? {}) as Parameters<typeof runClaimedPipelineJob>[1]["payload"],
        owner_user_id: job.owner_user_id as string | null,
      });

      processed.push({ jobId: job.id, slug: result.slug, digestId: result.digestId });
    } catch (error) {
      failures.push({
        jobId: job.id,
        error: error instanceof Error ? error.message : "Unknown pipeline job error.",
      });
    }
  }

  return NextResponse.json({
    ok: true,
    processedCount: processed.length,
    failureCount: failures.length,
    processed,
    failures,
  });
}
