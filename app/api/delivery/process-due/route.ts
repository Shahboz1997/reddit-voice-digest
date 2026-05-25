import { NextResponse } from "next/server";

import { processDueDeliveries } from "@/lib/delivery/process-due-deliveries";

export const maxDuration = 300;

function bearerToken(request: Request) {
  const raw = request.headers.get("authorization")?.trim();
  if (!raw?.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return raw.slice(7).trim() || null;
}

function expectedSecret() {
  return (
    process.env.DELIVERY_CRON_SECRET?.trim() ||
    process.env.PIPELINE_CRON_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    ""
  );
}

async function runDeliveryTick(request: Request) {
  const expected = expectedSecret();

  if (!expected) {
    return NextResponse.json(
      { error: "DELIVERY_CRON_SECRET, PIPELINE_CRON_SECRET, or CRON_SECRET is not configured." },
      { status: 503 },
    );
  }

  if (bearerToken(request) !== expected) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await processDueDeliveries();
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Delivery tick failed.",
      },
      { status: 500 },
    );
  }
}

/** Vercel Cron uses GET; manual/Supabase triggers may use POST. */
export async function GET(request: Request) {
  return runDeliveryTick(request);
}

export async function POST(request: Request) {
  return runDeliveryTick(request);
}
