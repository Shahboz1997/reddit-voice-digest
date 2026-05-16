import { NextResponse, type NextRequest } from "next/server";

import { hasSupabaseBrowserEnv } from "@/lib/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function safeAppPath(next: string): string {
  if (!next.startsWith("/") || next.startsWith("//")) {
    return "/";
  }
  return next;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = safeAppPath(requestUrl.searchParams.get("next") ?? "/");
  const err =
    requestUrl.searchParams.get("error_description") ?? requestUrl.searchParams.get("error");

  if (err) {
    const target = new URL(nextPath, requestUrl.origin);
    target.searchParams.set("auth_error", err);
    return NextResponse.redirect(target);
  }

  if (!code || !hasSupabaseBrowserEnv()) {
    return NextResponse.redirect(new URL(nextPath, requestUrl.origin));
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const target = new URL(nextPath, requestUrl.origin);
    target.searchParams.set("auth_error", error.message);
    return NextResponse.redirect(target);
  }

  return NextResponse.redirect(new URL(nextPath, requestUrl.origin));
}
