import { NextResponse } from "next/server";
import { z } from "zod";

import { runDigestPipeline } from "@/lib/pipeline/run-digest-pipeline";

/** Cron / Edge Function: full daily pipeline (public digest, no owner). */
export const maxDuration = 300;

const bodySchema = z.object({
  runDate: z.string().optional(),
  selectedSubreddits: z.array(z.string().min(1)).optional(),
  threadsPerSource: z.number().int().positive().max(20).optional(),
  maxThreadsPerDigest: z.number().int().positive().max(5).optional(),
});

function bearerToken(request: Request) {
  const raw = request.headers.get("authorization")?.trim();
  if (!raw?.toLowerCase().startsWith("bearer ")) {
    return null;
  }
  return raw.slice(7).trim() || null;
}

async function runPublicPipelineCron(request: Request) {
  const expected =
    process.env.PIPELINE_CRON_SECRET?.trim() || process.env.CRON_SECRET?.trim();
  if (!expected) {
    return NextResponse.json(
      { error: "PIPELINE_CRON_SECRET or CRON_SECRET is not configured on this deployment." },
      { status: 503 },
    );
  }

  if (bearerToken(request) !== expected) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(
    request.headers.get("content-length") ? await request.json().catch(() => ({})) : {},
  );

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await runDigestPipeline({
      runDate: parsed.data.runDate ? new Date(parsed.data.runDate) : new Date(),
      selectedSubreddits: parsed.data.selectedSubreddits,
      threadsPerSource: parsed.data.threadsPerSource,
      maxThreadsPerDigest: parsed.data.maxThreadsPerDigest,
    });

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Pipeline failed.",
      },
      { status: 500 },
    );
  }
}

/** Vercel Cron uses GET; manual/Supabase triggers may use POST. */
export async function GET(request: Request) {
  return runPublicPipelineCron(request);
}

export async function POST(request: Request) {
  return runPublicPipelineCron(request);
}
