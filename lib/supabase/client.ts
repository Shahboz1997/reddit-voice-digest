"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseBrowserKey, hasSupabaseBrowserEnv } from "@/lib/config";

export function createClientSupabaseClient() {
  if (!hasSupabaseBrowserEnv()) {
    throw new Error("Supabase browser environment variables are not configured.");
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    getSupabaseBrowserKey()!,
  );
}
