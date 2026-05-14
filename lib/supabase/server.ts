import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabaseBrowserKey, publicEnv } from "@/lib/config";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const browserKey = getSupabaseBrowserKey();

  return createServerClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL ?? "",
    browserKey ?? "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components may call this during rendering.
            // Middleware is responsible for refreshing auth cookies.
          }
        },
      },
    },
  );
}
