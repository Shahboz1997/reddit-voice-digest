import { createClient } from "@supabase/supabase-js";

import { hasSupabaseAdminEnv, publicEnv } from "@/lib/config";

export function createAdminSupabaseClient() {
  if (!hasSupabaseAdminEnv()) {
    throw new Error("Supabase admin environment variables are not configured.");
  }

  return createClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
