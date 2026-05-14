import { NextResponse } from "next/server";
import { z } from "zod";

import { runDigestPipeline } from "@/lib/pipeline/run-digest-pipeline";

const requestSchema = z.object({
  runDate: z.string().optional(),
  selectedSubreddits: z.array(z.string().min(1)).optional(),
  threadsPerSource: z.number().int().positive().max(20).optional(),
  maxThreadsPerDigest: z.number().int().positive().max(5).optional(),
});

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "This development trigger route is disabled in production." },
      { status: 403 },
    );
  }

  const body = request.headers.get("content-length")
    ? requestSchema.safeParse(await request.json())
    : requestSchema.safeParse({});

  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
  }

  try {
    const result = await runDigestPipeline({
      runDate: body.data.runDate ? new Date(body.data.runDate) : undefined,
      selectedSubreddits: body.data.selectedSubreddits,
      threadsPerSource: body.data.threadsPerSource,
      maxThreadsPerDigest: body.data.maxThreadsPerDigest,
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
