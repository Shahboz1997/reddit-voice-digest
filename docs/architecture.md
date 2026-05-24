# Reddit Voice Digest Architecture

## Goal

Collect large, high-signal Reddit discussions, compress them into short daily audio digests, and
publish both transcript and audio.

## Delivery path

1. `Reddit API` provides top threads and comments.
2. Server-side noise filtering removes low-signal comments before LLM calls.
3. `OpenAI` (summary model) turns filtered comments into structured summaries.
4. `OpenAI` (script model) or dialogue engine builds the final podcast script.
5. `OpenAI TTS` or `ElevenLabs` renders audio through the provider boundary.
6. `Supabase Database` stores sources, threads, comments, digests, summary cache, and job logs.
7. `Supabase Storage` stores the final MP3.
8. `Next.js` renders the latest digest, SEO pages, and archive.

## Pipeline modes

- **multi** — up to 3 high-quality threads in one episode (default)
- **single_thread** — one Reddit discussion per episode (~5 minutes)
- **redditPostReference** — fetch a specific thread by URL or post id

## Background jobs

Long-running generation can be queued in `pipeline_jobs`. Vercel cron calls
`/api/pipeline/jobs/process` every 5 minutes to claim and run queued jobs.

## Core database entities

- `sources`
- `threads`
- `comments`
- `digest_runs` (public + per-owner runs)
- `digests`
- `digest_items`
- `thread_summary_cache`
- `pipeline_jobs`
- `job_logs`

## Execution plan

The production-safe sequence should be:

1. Pull active subreddits from `sources` or user preferences.
2. Fetch top daily threads from Reddit (or one explicit thread).
3. Score threads for quality and filter noisy comments in code.
4. Reuse cached summaries when the comment sample hash matches.
5. Build per-thread summaries, then one final podcast script.
6. Render audio and upload it to storage.
7. Mark the digest as published and notify RSS/Telegram channels.
