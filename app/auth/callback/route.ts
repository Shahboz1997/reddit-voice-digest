import { NextResponse, type NextRequest } from "next/server";

import { hasSupabaseBrowserEnv } from "@/lib/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";

  if (!code || !hasSupabaseBrowserEnv()) {
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  }

  const supabase = await createServerSupabaseClient();
  await supabase.auth.exchangeCodeForSession(code);

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
