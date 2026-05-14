import { NextResponse } from "next/server";

import { hasSupabaseBrowserEnv, publicEnv } from "@/lib/config";

export async function GET() {
  return NextResponse.json({
    ok: true,
    appUrl: publicEnv.NEXT_PUBLIC_APP_URL,
    supabaseBrowserConfigured: hasSupabaseBrowserEnv(),
    timestamp: new Date().toISOString(),
  });
}
