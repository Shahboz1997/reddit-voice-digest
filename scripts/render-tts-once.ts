import "../lib/load-env";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

function ensurePlaceholders() {
  const placeholders: Record<string, string> = {
    SUPABASE_SERVICE_ROLE_KEY: "local-audio-test",
    REDDIT_CLIENT_ID: "local-audio-test",
    REDDIT_CLIENT_SECRET: "local-audio-test",
    REDDIT_USER_AGENT: "local-audio-test/1.0",
  };

  for (const [key, value] of Object.entries(placeholders)) {
    if (!process.env[key]?.trim()) {
      process.env[key] = value;
    }
  }
}

ensurePlaceholders();

const presetId = (process.argv[2] ?? "ielts-opener").trim();

async function main() {
  const { TTS_PRESETS } = await import("../lib/tts-presets");
  const preset = TTS_PRESETS[presetId as keyof typeof TTS_PRESETS];

  if (!preset) {
    throw new Error(`Unknown preset "${presetId}". Available: ${Object.keys(TTS_PRESETS).join(", ")}`);
  }

  const { renderWithOpenAiTts } = await import("../lib/openai/client");
  const { getMp3DurationSeconds } = await import("../lib/audio/mp3-duration");

  const audio = await renderWithOpenAiTts(preset.text);
  const cacheFile = path.join(process.cwd(), "tmp", "tts-cache", `${presetId}.mp3`);

  await mkdir(path.dirname(cacheFile), { recursive: true });
  await writeFile(cacheFile, audio);

  const durationSeconds = getMp3DurationSeconds(audio);

  console.log(`Saved ${cacheFile} (${audio.length} bytes, ${durationSeconds}s)`);
  console.log(`Play in browser: /api/tts?preset=${presetId}`);
  console.log(`Text: ${preset.text}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
