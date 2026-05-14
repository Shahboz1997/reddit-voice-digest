import "../lib/load-env";

import { createClient } from "@supabase/supabase-js";

import { availableSubreddits } from "../lib/catalog";
import { getServerEnv, publicEnv } from "../lib/config";

async function main() {
  const env = getServerEnv();

  if (!publicEnv.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required.");
  }

  const supabase = createClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
  );

  const { error } = await supabase.from("sources").upsert(availableSubreddits, {
    onConflict: "subreddit_name",
  });

  if (error) {
    throw error;
  }

  console.log("Seeded default subreddit sources.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
