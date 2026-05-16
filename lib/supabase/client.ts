"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseBrowserKey, hasSupabaseBrowserEnv } from "@/lib/config";

let browserSupabaseClient: SupabaseClient | undefined;

export function createClientSupabaseClient() {
  if (!hasSupabaseBrowserEnv()) {
    throw new Error("Supabase browser environment variables are not configured.");
  }

  if (!browserSupabaseClient) {
    browserSupabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      getSupabaseBrowserKey()!,
    );
  }

  return browserSupabaseClient;
}
