import { defaultSubredditPreferences } from "@/lib/catalog";
import { notifyUserChannels } from "@/lib/delivery/notify-user-channels";
import {
  isDeliveryDueNow,
  isWeekdayInTimezone,
  localDateKey,
  normalizeTimezone,
} from "@/lib/delivery/timezone";
import { normalizeElevenLabsVoiceIdInput } from "@/lib/elevenlabs/voices";
import { runDigestPipeline } from "@/lib/pipeline/run-digest-pipeline";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { PersonaId, SummaryDepthId } from "@/lib/types";

interface UserPreferenceRow {
  user_id: string;
  selected_subreddits: string[] | null;
  voice: string | null;
  elevenlabs_voice_id: string | null;
  summary_depth: string | null;
  delivery_local_time: string | null;
  delivery_weekdays_only: boolean | null;
  timezone: string | null;
}

export interface ProcessDueDeliveriesResult {
  scanned: number;
  due: number;
  started: number;
  completed: number;
  skipped: number;
  errors: Array<{ userId: string; error: string }>;
}

function formatTimeForSlot(value: string) {
  return value.slice(0, 5);
}

function deliverySlotFromDb(value: string) {
  return formatTimeForSlot(value);
}

export async function processDueDeliveries(options?: {
  now?: Date;
  maxUsers?: number;
}): Promise<ProcessDueDeliveriesResult> {
  const now = options?.now ?? new Date();
  const maxUsers = Math.max(1, options?.maxUsers ?? Number(process.env.DELIVERY_MAX_USERS_PER_TICK ?? "2"));
  const supabase = createAdminSupabaseClient();

  const { data: rows, error } = await supabase
    .from("user_preferences")
    .select(
      "user_id, selected_subreddits, voice, elevenlabs_voice_id, summary_depth, delivery_local_time, delivery_weekdays_only, timezone",
    )
    .not("delivery_local_time", "is", null);

  if (error) {
    throw new Error(error.message);
  }

  const preferences = (rows ?? []) as UserPreferenceRow[];
  const result: ProcessDueDeliveriesResult = {
    scanned: preferences.length,
    due: 0,
    started: 0,
    completed: 0,
    skipped: 0,
    errors: [],
  };

  const dueUsers = preferences.filter((row) => {
    if (!row.delivery_local_time) {
      return false;
    }

    const timeZone = normalizeTimezone(row.timezone);
    const slot = deliverySlotFromDb(row.delivery_local_time);

    if (row.delivery_weekdays_only && !isWeekdayInTimezone(now, timeZone)) {
      return false;
    }

    return isDeliveryDueNow(slot, now, timeZone);
  });

  result.due = dueUsers.length;

  for (const row of dueUsers.slice(0, maxUsers)) {
    const timeZone = normalizeTimezone(row.timezone);
    const slot = deliverySlotFromDb(row.delivery_local_time!);
    const runDate = localDateKey(now, timeZone);

    const { data: claimed, error: claimError } = await supabase
      .from("delivery_runs")
      .insert({
        user_id: row.user_id,
        run_date: runDate,
        delivery_slot: `${slot}:00`,
        status: "running",
      })
      .select("id")
      .maybeSingle();

    if (claimError) {
      if (claimError.code === "23505") {
        result.skipped += 1;
        continue;
      }

      result.errors.push({ userId: row.user_id, error: claimError.message });
      continue;
    }

    if (!claimed?.id) {
      result.skipped += 1;
      continue;
    }

    result.started += 1;

    const selected = row.selected_subreddits?.filter(Boolean) ?? [];
    const subreddits = selected.length > 0 ? selected : defaultSubredditPreferences;

    if (!subreddits.length) {
      await supabase
        .from("delivery_runs")
        .update({ status: "failed", error_message: "No subreddits configured." })
        .eq("id", claimed.id);
      result.errors.push({ userId: row.user_id, error: "No subreddits configured." });
      continue;
    }

    try {
      const pipelineResult = await runDigestPipeline({
        runDate: now,
        selectedSubreddits: subreddits,
        persona: (row.voice as PersonaId) ?? "news_anchor",
        summaryDepth: (row.summary_depth as SummaryDepthId) ?? "standard",
        elevenlabsVoiceId: normalizeElevenLabsVoiceIdInput(row.elevenlabs_voice_id),
        ownerUserId: row.user_id,
      });

      await supabase
        .from("delivery_runs")
        .update({
          status: "completed",
          digest_id: pipelineResult.digestId,
          error_message: null,
        })
        .eq("id", claimed.id);

      const { data: digestRow } = await supabase
        .from("digests")
        .select("title, slug, summary_text, audio_url")
        .eq("id", pipelineResult.digestId)
        .maybeSingle();

      if (digestRow) {
        await notifyUserChannels(row.user_id, {
          title: digestRow.title,
          slug: digestRow.slug,
          summaryText: digestRow.summary_text ?? "",
          audioUrl: digestRow.audio_url,
        }).catch(() => {
          // Delivery succeeded even if notify fails.
        });
      }

      result.completed += 1;
    } catch (pipelineError) {
      const message = pipelineError instanceof Error ? pipelineError.message : "Pipeline failed.";

      await supabase
        .from("delivery_runs")
        .update({ status: "failed", error_message: message })
        .eq("id", claimed.id);

      result.errors.push({ userId: row.user_id, error: message });
    }
  }

  await supabase.from("job_logs").insert({
    job_name: "delivery-tick",
    status: result.errors.length ? "completed_with_errors" : "completed",
    payload: { due: result.due, started: result.started, completed: result.completed },
    response: result,
  });

  return result;
}
