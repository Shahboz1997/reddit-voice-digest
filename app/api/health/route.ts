import { NextResponse } from "next/server";

import { hasSupabaseAdminEnv, hasSupabaseBrowserEnv, publicEnv } from "@/lib/config";

function hasPipelineEnv() {
  return Boolean(
    process.env.OPENAI_API_KEY &&
      process.env.REDDIT_CLIENT_ID &&
      process.env.REDDIT_CLIENT_SECRET &&
      process.env.REDDIT_USER_AGENT,
  );
}

function hasCronSecret() {
  return Boolean(
    process.env.CRON_SECRET?.trim() ||
      process.env.PIPELINE_CRON_SECRET?.trim() ||
      process.env.DELIVERY_CRON_SECRET?.trim(),
  );
}

export async function GET() {
  const checks = {
    supabaseBrowser: hasSupabaseBrowserEnv(),
    supabaseAdmin: hasSupabaseAdminEnv(),
    pipeline: hasPipelineEnv(),
    cronSecret: hasCronSecret(),
    audioProvider: process.env.AUDIO_PROVIDER ?? "openai",
  };

  const ready =
    checks.supabaseBrowser && checks.supabaseAdmin && checks.pipeline;

  return NextResponse.json(
    {
      ok: ready,
      appUrl: publicEnv.NEXT_PUBLIC_APP_URL,
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: ready ? 200 : 503 },
  );
}
