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

const DEFAULT_PROMPT = "Is a golden retriever a good family dog?";
const prompt = process.argv.slice(2).join(" ").trim() || DEFAULT_PROMPT;

async function main() {
  const { renderWithOpenAiTts } = await import("../lib/openai/client");
  const { getMp3DurationSeconds } = await import("../lib/audio/mp3-duration");

  const audio = await renderWithOpenAiTts(prompt);
  const outputFile = path.join(process.cwd(), "tmp", "gpt-audio-cache", "dog.mp3");

  await mkdir(path.dirname(outputFile), { recursive: true });
  await writeFile(outputFile, audio);

  console.log(`Saved ${outputFile} (${audio.length} bytes, ${getMp3DurationSeconds(audio)}s)`);
  console.log(`Prompt: ${prompt}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
