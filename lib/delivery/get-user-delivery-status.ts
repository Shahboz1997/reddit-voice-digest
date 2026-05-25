import { describeNextDelivery } from "@/lib/delivery/next-delivery";
import { normalizeTimezone } from "@/lib/delivery/timezone";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export interface DeliveryRunSummary {
  status: string;
  runDate: string;
  deliverySlot: string;
  createdAt: string;
  digestSlug: string | null;
  digestTitle: string | null;
  errorMessage: string | null;
}

export interface UserDeliveryStatus {
  scheduled: boolean;
  deliveryLocalTime: string | null;
  timezone: string;
  deliveryWeekdaysOnly: boolean;
  nextDeliveryLabel: string | null;
  lastRun: DeliveryRunSummary | null;
  recentRuns: DeliveryRunSummary[];
}

function formatTimeForInput(value: string) {
  return value.slice(0, 5);
}

function mapRunRow(
  row: {
    status: string;
    run_date: string;
    delivery_slot: string;
    created_at: string;
    error_message: string | null;
    digests: { slug: string; title: string } | { slug: string; title: string }[] | null;
  },
): DeliveryRunSummary {
  const digest = Array.isArray(row.digests) ? row.digests[0] : row.digests;

  return {
    status: row.status,
    runDate: row.run_date,
    deliverySlot: formatTimeForInput(String(row.delivery_slot)),
    createdAt: row.created_at,
    digestSlug: digest?.slug ?? null,
    digestTitle: digest?.title ?? null,
    errorMessage: row.error_message,
  };
}

export async function getUserDeliveryStatus(userId: string): Promise<UserDeliveryStatus> {
  const admin = createAdminSupabaseClient();

  const { data: prefs, error: prefsError } = await admin
    .from("user_preferences")
    .select("delivery_local_time, delivery_weekdays_only, timezone")
    .eq("user_id", userId)
    .maybeSingle();

  if (prefsError) {
    throw new Error(prefsError.message);
  }

  const deliveryLocalTime =
    prefs?.delivery_local_time != null ? formatTimeForInput(String(prefs.delivery_local_time)) : null;
  const timezone = normalizeTimezone(prefs?.timezone as string | undefined);
  const deliveryWeekdaysOnly = Boolean(prefs?.delivery_weekdays_only);

  const { data: runRows, error: runsError } = await admin
    .from("delivery_runs")
    .select(
      "status, run_date, delivery_slot, created_at, error_message, digests ( slug, title )",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (runsError) {
    throw new Error(runsError.message);
  }

  const recentRuns = (runRows ?? []).map((row) => mapRunRow(row as unknown as Parameters<typeof mapRunRow>[0]));

  const lastCompleted = recentRuns.find((run) => run.status === "completed");

  const nextDeliveryLabel =
    deliveryLocalTime &&
    describeNextDelivery({
      deliveryLocalTime,
      timeZone: timezone,
      weekdaysOnly: deliveryWeekdaysOnly,
      lastCompletedRunDate: lastCompleted?.runDate ?? null,
    });

  return {
    scheduled: Boolean(deliveryLocalTime),
    deliveryLocalTime,
    timezone,
    deliveryWeekdaysOnly,
    nextDeliveryLabel: nextDeliveryLabel ?? null,
    lastRun: recentRuns[0] ?? null,
    recentRuns,
  };
}

export function deliveryStatusHeadline(status: UserDeliveryStatus) {
  if (!status.scheduled) {
    return "Set a delivery time above to enable automatic daily digests.";
  }

  const parts: string[] = [];

  if (status.nextDeliveryLabel) {
    parts.push(`Next: ${status.nextDeliveryLabel}.`);
  }

  if (status.lastRun) {
    const when = new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(status.lastRun.createdAt));

    if (status.lastRun.status === "completed" && status.lastRun.digestTitle) {
      parts.push(`Last run completed ${when} — “${status.lastRun.digestTitle}”.`);
    } else if (status.lastRun.status === "failed") {
      parts.push(
        `Last run failed ${when}${status.lastRun.errorMessage ? `: ${status.lastRun.errorMessage}` : "."}`,
      );
    } else if (status.lastRun.status === "running") {
      parts.push(`A digest is being generated now (started ${when}).`);
    } else {
      parts.push(`Last run: ${status.lastRun.status} (${when}).`);
    }
  } else {
    parts.push("No automatic runs yet — cron checks every ~10 minutes.");
  }

  return parts.join(" ");
}
