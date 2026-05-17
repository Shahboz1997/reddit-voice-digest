import { NextResponse, type NextRequest } from "next/server";

import { publicEnv } from "@/lib/config";
import { notifyUserChannels } from "@/lib/delivery/notify-user-channels";
import { sendTelegramMessage } from "@/lib/telegram/send-message";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const MAX_SUMMARY_CHARS = 3500;

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/** POST `/api/telegram-notify` — latest public digest or per-user digest → Telegram. */
export async function POST(request: NextRequest) {
  const secret = process.env.TELEGRAM_NOTIFY_SECRET?.trim();
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatIdRaw = process.env.TELEGRAM_CHAT_ID?.trim();

  if (!secret || !token) {
    return NextResponse.json({ error: "Telegram notify is not configured on the server." }, { status: 501 });
  }

  const auth = request.headers.get("authorization")?.trim();
  if (!auth?.startsWith("Bearer ") || auth.slice("Bearer ".length) !== secret) {
    return unauthorized();
  }

  const body = (await request.json().catch(() => ({}))) as {
    userId?: string;
    digestId?: string;
  };

  if (body.userId?.trim()) {
    let supabase;

    try {
      supabase = createAdminSupabaseClient();
    } catch {
      return NextResponse.json({ error: "Supabase admin is not configured." }, { status: 501 });
    }

    let digestQuery = supabase
      .from("digests")
      .select("title, slug, summary_text, audio_url")
      .eq("owner_user_id", body.userId.trim());

    if (body.digestId?.trim()) {
      digestQuery = digestQuery.eq("id", body.digestId.trim());
    } else {
      digestQuery = digestQuery.order("published_at", { ascending: false }).limit(1);
    }

    const { data: digest, error } = await digestQuery.maybeSingle();

    if (error || !digest) {
      return NextResponse.json({ error: error?.message ?? "Digest not found." }, { status: 404 });
    }

    const notify = await notifyUserChannels(body.userId.trim(), {
      title: digest.title,
      slug: digest.slug,
      summaryText: digest.summary_text ?? "",
      audioUrl: digest.audio_url,
    });

    return NextResponse.json({ ok: true, digestSlug: digest.slug, notify });
  }

  if (!chatIdRaw) {
    return NextResponse.json({ error: "TELEGRAM_CHAT_ID is required for broadcast notify." }, { status: 501 });
  }

  let supabase;

  try {
    supabase = createAdminSupabaseClient();
  } catch {
    return NextResponse.json({ error: "Supabase admin is not configured." }, { status: 501 });
  }

  const { data: digest, error } = await supabase
    .from("digests")
    .select("title, slug, summary_text, audio_url")
    .is("owner_user_id", null)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!digest) {
    return NextResponse.json({ error: "No public digest rows found." }, { status: 404 });
  }

  const baseUrl = publicEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const pageUrl = `${baseUrl}/digest/${digest.slug}`;
  const summary = (digest.summary_text ?? "").trim().slice(0, MAX_SUMMARY_CHARS);
  const audioLine = digest.audio_url?.trim() ? `Audio: ${digest.audio_url.trim()}` : "Audio: (not set yet)";
  const text = [digest.title, "", summary, "", audioLine, "", `Episode page: ${pageUrl}`]
    .filter(Boolean)
    .join("\n");

  try {
    const telegram = await sendTelegramMessage({ token, chatId: chatIdRaw, text });
    return NextResponse.json({ ok: true, digestSlug: digest.slug, telegram });
  } catch (notifyError) {
    return NextResponse.json(
      {
        error: notifyError instanceof Error ? notifyError.message : "Telegram API error.",
      },
      { status: 502 },
    );
  }
}
