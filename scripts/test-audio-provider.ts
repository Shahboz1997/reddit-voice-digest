import "../lib/load-env";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { PERSONAS, personaTtsVoice } from "../lib/digest-persona";
import type { PersonaId } from "../lib/types";

/** Lets the script run when .env.local only has TTS keys (no Reddit/Supabase). */
function ensureAudioTestEnvPlaceholders() {
  const placeholders: Record<string, string> = {
    SUPABASE_SERVICE_ROLE_KEY: "local-audio-test",
    REDDIT_CLIENT_ID: "local-audio-test",
    REDDIT_CLIENT_SECRET: "local-audio-test",
  };

  for (const [key, value] of Object.entries(placeholders)) {
    if (!process.env[key]?.trim()) {
      process.env[key] = value;
    }
  }
}

ensureAudioTestEnvPlaceholders();

type AudioProvider = "openai" | "elevenlabs";

function parseArgs() {
  const args = process.argv.slice(2);
  const subredditArg = args.find((arg) => arg.startsWith("--subreddit="));
  const providerArg = args.find((arg) => arg.startsWith("--provider="));
  const textArg = args.find((arg) => arg.startsWith("--text="));

  const providerRaw = providerArg?.replace("--provider=", "").trim();
  const allProviders = providerRaw === "all";

  return {
    subreddit: (subredditArg?.replace("--subreddit=", "") ?? "productivity").trim(),
    providers: allProviders
      ? (["openai", "elevenlabs"] as const)
      : ([(providerRaw as AudioProvider) || undefined].filter(Boolean) as AudioProvider[]),
    allProviders,
    customText: textArg?.replace("--text=", "").trim(),
  };
}

function personaSampleScript(subreddit: string, threadTitle: string, persona: PersonaId) {
  const label = PERSONAS.find((p) => p.id === persona)?.label ?? persona;
  return [
    `Welcome to today's r/${subreddit} digest.`,
    `Persona check: ${label}.`,
    `Top thread: ${threadTitle}.`,
    "Here's the quick take — one habit, one metric, one next step.",
    "Thanks for listening.",
  ].join(" ");
}

async function resolveSampleText(subreddit: string, customText?: string) {
  if (customText) {
    return { text: customText, threadTitle: "(custom text)" };
  }

  const hasReddit =
    process.env.REDDIT_CLIENT_ID?.trim() &&
    process.env.REDDIT_CLIENT_ID !== "local-audio-test" &&
    process.env.REDDIT_CLIENT_SECRET?.trim() &&
    process.env.REDDIT_CLIENT_SECRET !== "local-audio-test";

  if (!hasReddit) {
    return {
      threadTitle: "Sample thread for audio smoke test",
      text: personaSampleScript(subreddit, "How to stay consistent with deep work", "news_anchor"),
    };
  }

  try {
    const { fetchTopThreads } = await import("../lib/reddit/client");
    const threads = await fetchTopThreads(subreddit, 3);
    const thread = threads[0];
    if (!thread) {
      throw new Error("no threads returned");
    }

    const excerpt = thread.selftext?.trim().slice(0, 280);
    const body = excerpt ? ` ${excerpt}` : "";
    return {
      threadTitle: thread.title,
      text: `r/${subreddit} spotlight. ${thread.title}.${body}`.trim(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Reddit fetch skipped (${message}); using static sample.`);
    return {
      threadTitle: "Sample thread for audio smoke test",
      text: personaSampleScript(subreddit, "How to stay consistent with deep work", "news_anchor"),
    };
  }
}

async function renderForProvider(
  provider: AudioProvider,
  subreddit: string,
  baseText: string,
  threadTitle: string,
  outDir: string,
) {
  process.env.AUDIO_PROVIDER = provider;
  const { getServerEnv } = await import("../lib/config");
  const { renderPodcastAudio } = await import("../lib/audio/provider");
  const env = getServerEnv();

  if (provider === "elevenlabs" && !env.ELEVENLABS_API_KEY?.trim()) {
    console.warn(`Skipping ${provider}: ELEVENLABS_API_KEY is not set.`);
    return [];
  }

  const results: Array<
    | { persona: PersonaId; voice: string; file: string; bytes: number }
    | { persona: PersonaId; voice: string; error: string }
  > = [];

  for (const { id: persona, label } of PERSONAS) {
    const voice = personaTtsVoice(persona, provider);
    const text = baseText.includes("Persona check:")
      ? personaSampleScript(subreddit, threadTitle, persona)
      : `${label} voice sample. ${baseText}`;

    console.log(`→ ${provider} / ${persona} (voice: ${voice})`);

    try {
      const audio = await renderPodcastAudio(text, {
        voice,
        persona,
      });

      const file = path.join(outDir, provider, `${persona}.mp3`);
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, audio);

      results.push({ persona, voice, file, bytes: audio.length });
      console.log(`  saved ${file} (${audio.length} bytes)`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`  failed: ${message}`);
      results.push({ persona, voice, error: message });
    }
  }

  return results;
}

async function main() {
  const { subreddit, providers, allProviders, customText } = parseArgs();
  const { getServerEnv } = await import("../lib/config");
  const env = getServerEnv();

  if (!env.OPENAI_API_KEY?.trim()) {
    throw new Error("OPENAI_API_KEY is required in .env.local for audio smoke tests.");
  }
  const activeProviders =
    providers.length > 0 ? providers : ([env.AUDIO_PROVIDER] as AudioProvider[]);

  const { text: baseText, threadTitle } = await resolveSampleText(subreddit, customText);
  const outDir = path.join(process.cwd(), "tmp", "audio-tests", subreddit);

  console.log(`Subreddit: r/${subreddit}`);
  console.log(`Thread: ${threadTitle}`);
  console.log(`Providers: ${activeProviders.join(", ")}${allProviders ? " (all)" : ""}`);
  console.log(`Output: ${outDir}\n`);

  const summary: Record<string, unknown> = { subreddit, threadTitle, runs: [] as unknown[] };

  for (const provider of activeProviders) {
    const runs = await renderForProvider(provider, subreddit, baseText, threadTitle, outDir);
    summary.runs = [...(summary.runs as unknown[]), { provider, samples: runs }];
  }

  console.log("\nDone.");
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
