import { NextResponse } from "next/server";
import { z } from "zod";

import {
  defaultNotificationPreferences,
  defaultSubredditPreferences,
} from "@/lib/catalog";
import { hasSupabaseBrowserEnv, publicEnv } from "@/lib/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  NotificationPreference,
  PersonaId,
  SummaryDepthId,
} from "@/lib/types";

const notificationSchema = z.object({
  channelType: z.enum(["telegram", "rss"]),
  label: z.string(),
  isEnabled: z.boolean(),
  targetValue: z.string().optional(),
  helperText: z.string(),
});

const requestSchema = z.object({
  subreddits: z.array(z.string().min(1)).min(1),
  persona: z.enum(["bro_investor", "scholar", "news_anchor"]).default("news_anchor"),
  summaryDepth: z.enum(["short", "standard", "deep"]).default("standard"),
  deliveryLocalTime: z
    .union([z.string().regex(/^\d{2}:\d{2}$/), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v)),
  deliveryWeekdaysOnly: z.boolean().default(false),
  notifications: z.array(notificationSchema),
});

function buildDefaultResponse() {
  return {
    source: "demo" as const,
    subreddits: defaultSubredditPreferences,
    notifications: defaultNotificationPreferences,
    persona: "news_anchor" as PersonaId,
    summaryDepth: "standard" as SummaryDepthId,
    deliveryLocalTime: null as string | null,
    deliveryWeekdaysOnly: false,
    personalRssUrl: null as string | null,
    userApiRssUrl: null as string | null,
  };
}

function personalFeedUrlForToken(token: string) {
  const base = publicEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  return `${base}/rss/${token}.xml`;
}

function userApiRssUrlForUser(userId: string) {
  const base = publicEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  return `${base}/api/rss/${userId}`;
}

function formatTimeForInput(value: string | null | undefined): string | null {
  if (value == null || value === "") return null;
  return String(value).slice(0, 5);
}

function deliveryTimeForDb(hhmm: string | null): string | null {
  if (!hhmm || !/^\d{2}:\d{2}$/.test(hhmm)) return null;
  return `${hhmm}:00`;
}

export async function GET() {
  if (!hasSupabaseBrowserEnv()) {
    return NextResponse.json(buildDefaultResponse());
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(buildDefaultResponse());
  }

  const [
    { data: prefsRow, error: prefsError },
    { data: subredditRows, error: subredditError },
    { data: notificationRows, error: notificationError },
    profileRes,
  ] = await Promise.all([
    supabase
      .from("user_preferences")
      .select(
        "selected_subreddits, delivery_local_time, voice, summary_depth, delivery_weekdays_only",
      )
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("user_subreddit_preferences")
      .select("subreddit_name, sort_order")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("notification_channels")
      .select("channel_type, is_enabled, target_value")
      .eq("user_id", user.id)
      .order("channel_type"),
    supabase
      .from("user_profile_settings")
      .select(
        "rss_feed_token, persona, summary_depth, delivery_local_time, delivery_weekdays_only",
      )
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const profileError = profileRes.error;

  if (prefsError || subredditError || notificationError || profileError) {
    return NextResponse.json(buildDefaultResponse());
  }

  const profile = profileRes.data;

  const notifications: NotificationPreference[] = defaultNotificationPreferences.map((item) => {
    const match = notificationRows?.find((row) => row.channel_type === item.channelType);

    return match
      ? {
          ...item,
          isEnabled: match.is_enabled,
          targetValue: match.target_value ?? "",
        }
      : item;
  });

  const sortedRows = [...(subredditRows ?? [])].sort(
    (a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0),
  );
  const legacyOrder = sortedRows.map((row) => row.subreddit_name);
  const fromPrefs = prefsRow?.selected_subreddits?.filter(Boolean) ?? [];
  const subredditsOrdered =
    fromPrefs.length > 0 ? fromPrefs : legacyOrder.length ? legacyOrder : defaultSubredditPreferences;

  const deliveryFromPrefs =
    prefsRow?.delivery_local_time != null ? formatTimeForInput(prefsRow.delivery_local_time as string) : null;
  const deliveryFromProfile =
    profile?.delivery_local_time != null ? formatTimeForInput(profile.delivery_local_time as string) : null;

  return NextResponse.json({
    source: "remote",
    subreddits: subredditsOrdered,
    notifications,
    persona: ((prefsRow?.voice as PersonaId) ?? (profile?.persona as PersonaId)) ?? "news_anchor",
    summaryDepth:
      ((prefsRow?.summary_depth as SummaryDepthId) ?? (profile?.summary_depth as SummaryDepthId)) ?? "standard",
    deliveryLocalTime: deliveryFromPrefs ?? deliveryFromProfile,
    deliveryWeekdaysOnly: prefsRow?.delivery_weekdays_only ?? profile?.delivery_weekdays_only ?? false,
    personalRssUrl: profile?.rss_feed_token ? personalFeedUrlForToken(profile.rss_feed_token) : null,
    userApiRssUrl: userApiRssUrlForUser(user.id),
  });
}

export async function PUT(request: Request) {
  if (!hasSupabaseBrowserEnv()) {
    return NextResponse.json({ error: "Supabase is not configured yet." }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const parsed = requestSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;

  const { error: deleteSubredditError } = await supabase
    .from("user_subreddit_preferences")
    .delete()
    .eq("user_id", user.id);

  if (deleteSubredditError) {
    return NextResponse.json({ error: deleteSubredditError.message }, { status: 500 });
  }

  const { error: deleteNotificationsError } = await supabase
    .from("notification_channels")
    .delete()
    .eq("user_id", user.id);

  if (deleteNotificationsError) {
    return NextResponse.json({ error: deleteNotificationsError.message }, { status: 500 });
  }

  const subredditInserts = payload.subreddits.map((subreddit, index) => ({
    user_id: user.id,
    subreddit_name: subreddit,
    sort_order: index,
  }));

  const notificationInserts = payload.notifications.map((notification) => ({
    user_id: user.id,
    channel_type: notification.channelType,
    is_enabled: notification.isEnabled,
    target_value: notification.targetValue ?? "",
  }));

  const [{ error: insertSubredditsError }, { error: insertNotificationsError }, { error: prefsUpsertError }] =
    await Promise.all([
      supabase.from("user_subreddit_preferences").insert(subredditInserts),
      supabase.from("notification_channels").insert(notificationInserts),
      supabase.from("user_preferences").upsert(
        {
          user_id: user.id,
          selected_subreddits: payload.subreddits,
          voice: payload.persona,
          summary_depth: payload.summaryDepth,
          delivery_local_time: deliveryTimeForDb(payload.deliveryLocalTime ?? null),
          delivery_weekdays_only: payload.deliveryWeekdaysOnly,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      ),
    ]);

  if (insertSubredditsError || insertNotificationsError || prefsUpsertError) {
    return NextResponse.json(
      {
        error:
          insertSubredditsError?.message ??
          insertNotificationsError?.message ??
          prefsUpsertError?.message,
      },
      { status: 500 },
    );
  }

  const { data: existingProfile } = await supabase
    .from("user_profile_settings")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const profilePayload = {
    persona: payload.persona,
    summary_depth: payload.summaryDepth,
    delivery_local_time: payload.deliveryLocalTime ?? null,
    delivery_weekdays_only: payload.deliveryWeekdaysOnly,
    updated_at: new Date().toISOString(),
  };

  const profileUpsertError = existingProfile
    ? (await supabase.from("user_profile_settings").update(profilePayload).eq("user_id", user.id)).error
    : (
        await supabase.from("user_profile_settings").insert({
          user_id: user.id,
          ...profilePayload,
        })
      ).error;

  if (profileUpsertError) {
    return NextResponse.json({ error: profileUpsertError.message }, { status: 500 });
  }

  const { data: tokenRow } = await supabase
    .from("user_profile_settings")
    .select("rss_feed_token")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({
    ok: true,
    personalRssUrl: tokenRow?.rss_feed_token ? personalFeedUrlForToken(tokenRow.rss_feed_token) : null,
    userApiRssUrl: userApiRssUrlForUser(user.id),
  });
}
