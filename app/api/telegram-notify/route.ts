import { NextResponse, type NextRequest } from "next/server";

import { publicEnv } from "@/lib/config";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const MAX_SUMMARY_CHARS = 3500;

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/** POST `/api/telegram-notify` — latest digest → Telegram Bot API (`sendMessage`). */
export async function POST(request: NextRequest) {
  const secret = process.env.TELEGRAM_NOTIFY_SECRET?.trim();
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatIdRaw = process.env.TELEGRAM_CHAT_ID?.trim();

  if (!secret || !token || !chatIdRaw) {
    return NextResponse.json({ error: "Telegram notify is not configured on the server." }, { status: 501 });
  }

  const auth = request.headers.get("authorization")?.trim();
  if (!auth?.startsWith("Bearer ") || auth.slice("Bearer ".length) !== secret) {
    return unauthorized();
  }

  let supabase;
  try {
    supabase = createAdminSupabaseClient();
  } catch {
    return NextResponse.json({ error: "Supabase admin is not configured." }, { status: 501 });
  }

  const { data: digest, error } = await supabase
    .from("digests")
    .select("title, slug, summary_text, audio_url, published_at, created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!digest) {
    return NextResponse.json({ error: "No digest rows found." }, { status: 404 });
  }

  const baseUrl = publicEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const pageUrl = `${baseUrl}/digest/${digest.slug}`;
  const summary = (digest.summary_text ?? "").trim().slice(0, MAX_SUMMARY_CHARS);
  const audioLine = digest.audio_url?.trim() ? `Audio: ${digest.audio_url.trim()}` : "Audio: (not set yet)";
  const textLines = [`${digest.title}`, "", summary, "", audioLine, "", `Episode page: ${pageUrl}`];

  const tgPayload = {
    chat_id: chatIdRaw,
    text: textLines.filter(Boolean).join("\n"),
  };

  const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tgPayload),
  });

  const tgBody = (await tgRes.json().catch(() => ({}))) as {
    ok?: boolean;
    description?: string;
  };

  if (!tgRes.ok || tgBody.ok === false) {
    return NextResponse.json(
      {
        error: tgBody.description ?? tgRes.statusText,
        telegramStatus: tgRes.status,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    digestSlug: digest.slug,
    telegram: tgBody,
  });
}
