import { publicEnv } from "@/lib/config";
import { sendTelegramMessage } from "@/lib/telegram/send-message";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export interface DigestNotifyPayload {
  title: string;
  slug: string;
  summaryText: string;
  audioUrl?: string | null;
}

export async function notifyUserChannels(userId: string, digest: DigestNotifyPayload) {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) {
    return { telegram: "skipped_no_bot_token" as const };
  }

  let supabase;

  try {
    supabase = createAdminSupabaseClient();
  } catch {
    return { telegram: "skipped_no_admin" as const };
  }

  const { data: channels, error } = await supabase
    .from("notification_channels")
    .select("channel_type, target_value, is_enabled")
    .eq("user_id", userId)
    .eq("is_enabled", true);

  if (error) {
    throw new Error(error.message);
  }

  const telegram = channels?.find((row) => row.channel_type === "telegram");
  const chatId = telegram?.target_value?.trim();

  if (!telegram || !chatId) {
    return { telegram: "skipped_no_channel" as const };
  }

  const baseUrl = publicEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const pageUrl = `${baseUrl}/digest/${digest.slug}`;
  const summary = digest.summaryText.trim().slice(0, 3500);
  const audioLine = digest.audioUrl?.trim() ? `Audio: ${digest.audioUrl.trim()}` : "";

  const text = [digest.title, "", summary, audioLine, "", `Episode: ${pageUrl}`]
    .filter(Boolean)
    .join("\n");

  await sendTelegramMessage({ token, chatId, text });

  return { telegram: "sent" as const };
}
