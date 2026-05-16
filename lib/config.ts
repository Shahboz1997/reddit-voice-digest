import { z } from "zod";

function emptyStringToUndefined(value: unknown) {
  return typeof value === "string" && value.trim() === "" ? undefined : value;
}

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.preprocess(
    emptyStringToUndefined,
    z.string().url().default("http://localhost:3000"),
  ),
  NEXT_PUBLIC_SUPABASE_URL: z.preprocess(
    emptyStringToUndefined,
    z.string().url().optional(),
  ),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.preprocess(
    emptyStringToUndefined,
    z.string().optional(),
  ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.preprocess(
    emptyStringToUndefined,
    z.string().optional(),
  ),
  /** Absolute or site-relative HTTPS URL for cover art (recommended 1400–3000 px square JPEG/PNG for Apple Podcasts). */
  NEXT_PUBLIC_PODCAST_IMAGE_URL: z.preprocess(emptyStringToUndefined, z.string().optional()),
});

const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.preprocess(emptyStringToUndefined, z.string().min(1)),
  SUPABASE_STORAGE_BUCKET: z.preprocess(
    emptyStringToUndefined,
    z.string().default("digest-audio"),
  ),
  OPENAI_API_KEY: z.preprocess(emptyStringToUndefined, z.string().min(1)),
  OPENAI_MODEL: z.preprocess(emptyStringToUndefined, z.string().default("gpt-4o-mini")),
  OPENAI_TTS_MODEL: z.preprocess(
    emptyStringToUndefined,
    z.string().default("gpt-4o-mini-tts"),
  ),
  OPENAI_TTS_VOICE: z.preprocess(emptyStringToUndefined, z.string().default("alloy")),
  REDDIT_CLIENT_ID: z.preprocess(emptyStringToUndefined, z.string().min(1)),
  REDDIT_CLIENT_SECRET: z.preprocess(emptyStringToUndefined, z.string().min(1)),
  REDDIT_USER_AGENT: z.preprocess(emptyStringToUndefined, z.string().min(1)),
  AUDIO_PROVIDER: z.preprocess(
    emptyStringToUndefined,
    z.enum(["openai", "assemblyai"]).default("openai"),
  ),
  ASSEMBLYAI_API_KEY: z.preprocess(emptyStringToUndefined, z.string().optional()),
});

export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_PODCAST_IMAGE_URL: process.env.NEXT_PUBLIC_PODCAST_IMAGE_URL,
});

export function getServerEnv() {
  return serverEnvSchema.parse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
    OPENAI_TTS_MODEL: process.env.OPENAI_TTS_MODEL,
    OPENAI_TTS_VOICE: process.env.OPENAI_TTS_VOICE,
    REDDIT_CLIENT_ID: process.env.REDDIT_CLIENT_ID,
    REDDIT_CLIENT_SECRET: process.env.REDDIT_CLIENT_SECRET,
    REDDIT_USER_AGENT: process.env.REDDIT_USER_AGENT,
    AUDIO_PROVIDER: process.env.AUDIO_PROVIDER,
    ASSEMBLYAI_API_KEY: process.env.ASSEMBLYAI_API_KEY,
  });
}

export function hasSupabaseBrowserEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      getSupabaseBrowserKey(),
  );
}

export function hasSupabaseAdminEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function getSupabaseBrowserKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
