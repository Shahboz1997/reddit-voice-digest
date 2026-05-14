import { createClient } from "npm:@supabase/supabase-js@2";

interface SourceRow {
  id: string;
  subreddit_name: string;
  priority: number;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json(
      { error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY." },
      { status: 500, headers: corsHeaders },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const runDate = new Date().toISOString().slice(0, 10);

  const { data: run, error: runError } = await supabase
    .from("digest_runs")
    .upsert({ run_date: runDate, status: "processing" }, { onConflict: "run_date" })
    .select("id, run_date, status")
    .single();

  if (runError) {
    return Response.json({ error: runError.message }, { status: 500, headers: corsHeaders });
  }

  const { data: sources, error: sourcesError } = await supabase
    .from("sources")
    .select("id, subreddit_name, priority")
    .eq("is_active", true)
    .order("priority", { ascending: false });

  if (sourcesError) {
    await logJob(supabase, "daily-pipeline", "failed", { runDate }, { error: sourcesError.message });
    return Response.json({ error: sourcesError.message }, { status: 500, headers: corsHeaders });
  }

  // This function is the deployment entry point in Supabase. The actual API clients and ranking
  // logic are already scaffolded in the Next.js app under lib/. The next implementation step is to
  // port those calls here or invoke a secured backend route that runs the Node-side pipeline.
  await logJob(
    supabase,
    "daily-pipeline",
    "queued",
    { runDate },
    {
      message: "Pipeline scaffold created.",
      next_steps: [
        "Fetch top threads for each active subreddit from Reddit OAuth API.",
        "Store raw threads and selected comments into public.threads and public.comments.",
        "Generate per-thread summaries and a final 600-700 word script with OpenAI.",
        "Render audio via OpenAI TTS or a future AssemblyAI-compatible adapter.",
        "Upload MP3 to Supabase Storage and publish the digest row.",
      ],
      active_sources: (sources ?? []).map((source: SourceRow) => source.subreddit_name),
    },
  );

  return Response.json(
    {
      ok: true,
      digestRun: run,
      activeSources: (sources ?? []).map((source: SourceRow) => source.subreddit_name),
      message: "Daily pipeline entrypoint is ready for the next implementation pass.",
    },
    { headers: corsHeaders },
  );
});

async function logJob(
  supabase: ReturnType<typeof createClient>,
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
