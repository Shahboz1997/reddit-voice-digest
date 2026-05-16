import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

interface SourceRow {
  id: string;
  subreddit_name: string;
  priority: number;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(corsHeaders);
  headers.set("Content-Type", "application/json; charset=utf-8");
  const extra = init.headers;
  if (extra instanceof Headers) {
    extra.forEach((value, key) => headers.set(key, value));
  } else if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (value !== undefined) {
        headers.set(key, Array.isArray(value) ? value.join(", ") : value);
      }
    }
  }
  return new Response(JSON.stringify(body), { ...init, headers });
}

/** Секрет входящего вызова Edge (pg_cron / ручной POST). Не путать с PIPELINE_CRON_SECRET на Next. */
function inboundSecret() {
  return Deno.env.get("EDGE_CRON_SECRET")?.trim() ?? Deno.env.get("DAILY_PIPELINE_EDGE_SECRET")?.trim() ?? "";
}

function verifyInbound(request: Request): boolean {
  const expected = inboundSecret();
  if (!expected) {
    return true;
  }

  const authHeader = request.headers.get("authorization");
  const bearer = (authHeader?.replace(/^Bearer\s+/i, "") ?? "").trim();
  const header = request.headers.get("x-cron-secret")?.trim() ?? "";
  return bearer === expected || header === expected;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed." }, { status: 405 });
  }

  if (!verifyInbound(request)) {
    return json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim() ?? Deno.env.get("SERVICE_ROLE_KEY")?.trim() ?? "";

  if (!supabaseUrl || !serviceRoleKey) {
    return json(
      { error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (set as Edge Function secret)." },
      { status: 500 },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const runDate = new Date().toISOString().slice(0, 10);

  const pipelineUrl = Deno.env.get("PIPELINE_CRON_URL")?.trim();
  const pipelineSecret = Deno.env.get("PIPELINE_CRON_SECRET")?.trim();

  const { data: sources, error: sourcesError } = await supabase
    .from("sources")
    .select("id, subreddit_name, priority")
    .eq("is_active", true)
    .order("priority", { ascending: false });

  if (sourcesError) {
    await logJob(supabase, "daily-pipeline", "failed", { runDate }, { error: sourcesError.message });
    return json({ error: sourcesError.message }, { status: 500 });
  }

  const activeSources = (sources ?? []).map((source: SourceRow) => source.subreddit_name);

  if (!pipelineUrl || !pipelineSecret) {
    await logJob(
      supabase,
      "daily-pipeline",
      "skipped",
      { runDate },
      {
        message:
          "Configure secrets PIPELINE_CRON_URL (POST .../api/pipeline/cron) and PIPELINE_CRON_SECRET (same value as on Next.js).",
        active_sources: activeSources,
      },
    );

    return json({
      ok: true,
      skipped: true,
      runDate,
      activeSources,
      message:
        "Edge function did not invoke the Node pipeline: set PIPELINE_CRON_URL and PIPELINE_CRON_SECRET in Supabase Function secrets.",
    });
  }

  try {
    const controller = new AbortController();
    const timeoutMs = Number(Deno.env.get("PIPELINE_FETCH_TIMEOUT_MS") ?? "120000");
    const bounded = Math.min(Math.max(timeoutMs, 10_000), 300_000);
    const timer = setTimeout(() => controller.abort(), bounded);

    let pipelineResponse: Response;

    try {
      pipelineResponse = await fetch(pipelineUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${pipelineSecret}`,
        },
        body: JSON.stringify({ runDate }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    const text = await pipelineResponse.text();
    let body: Record<string, unknown> = {};
    try {
      body = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    } catch {
      body = { raw: text.slice(0, 500) };
    }

    if (!pipelineResponse.ok) {
      await logJob(supabase, "daily-pipeline", "failed", { runDate, active_sources: activeSources }, body);
      return json(
        {
          ok: false,
          runDate,
          activeSources,
          status: pipelineResponse.status,
          upstream: body,
        },
        { status: 502 },
      );
    }

    await logJob(supabase, "daily-pipeline", "completed", { runDate, active_sources: activeSources }, body);

    return json({
      ok: true,
      runDate,
      activeSources,
      upstream: body,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await logJob(
      supabase,
      "daily-pipeline",
      "failed",
      { runDate, active_sources: activeSources },
      { error: message },
    );

    return json(
      {
        ok: false,
        runDate,
        activeSources,
        error: message,
      },
      { status: 500 },
    );
  }
});

async function logJob(
  supabase: SupabaseClient,
  jobName: string,
  status: string,
  payload: Record<string, unknown>,
  response: Record<string, unknown>,
) {
  await supabase.from("job_logs").insert({
    job_name: jobName,
    status,
    payload,
    response,
  });
}
