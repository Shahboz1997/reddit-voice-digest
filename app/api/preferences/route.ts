import { NextResponse } from "next/server";
import { z } from "zod";

import {
  defaultNotificationPreferences,
  defaultSubredditPreferences,
} from "@/lib/catalog";
import { hasSupabaseBrowserEnv } from "@/lib/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  subreddits: z.array(z.string().min(1)).min(1),
  notifications: z.array(
    z.object({
      channelType: z.enum(["telegram", "rss"]),
      label: z.string(),
      isEnabled: z.boolean(),
      targetValue: z.string().optional(),
      helperText: z.string(),
    }),
  ),
});

function buildDefaultResponse() {
  return {
    source: "demo",
    subreddits: defaultSubredditPreferences,
    notifications: defaultNotificationPreferences,
  };
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

  const [{ data: subredditRows, error: subredditError }, { data: notificationRows, error: notificationError }] =
    await Promise.all([
      supabase
        .from("user_subreddit_preferences")
        .select("subreddit_name")
        .eq("user_id", user.id)
        .order("subreddit_name"),
      supabase
        .from("notification_channels")
        .select("channel_type, is_enabled, target_value")
        .eq("user_id", user.id)
        .order("channel_type"),
    ]);

  if (subredditError || notificationError) {
    return NextResponse.json(buildDefaultResponse());
  }

  const notifications = defaultNotificationPreferences.map((item) => {
    const match = notificationRows?.find((row) => row.channel_type === item.channelType);

    return match
      ? {
          ...item,
          isEnabled: match.is_enabled,
          targetValue: match.target_value ?? "",
        }
      : item;
  });

  return NextResponse.json({
    source: "remote",
    subreddits: subredditRows?.map((row) => row.subreddit_name) ?? defaultSubredditPreferences,
    notifications,
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

  const subredditInserts = payload.subreddits.map((subreddit) => ({
    user_id: user.id,
    subreddit_name: subreddit,
  }));

  const notificationInserts = payload.notifications.map((notification) => ({
    user_id: user.id,
    channel_type: notification.channelType,
    is_enabled: notification.isEnabled,
    target_value: notification.targetValue ?? "",
  }));

  const [{ error: insertSubredditsError }, { error: insertNotificationsError }] = await Promise.all([
    supabase.from("user_subreddit_preferences").insert(subredditInserts),
    supabase.from("notification_channels").insert(notificationInserts),
  ]);

  if (insertSubredditsError || insertNotificationsError) {
    return NextResponse.json(
      {
        error: insertSubredditsError?.message ?? insertNotificationsError?.message,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
