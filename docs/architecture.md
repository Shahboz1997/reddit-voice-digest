# Reddit Voice Digest Architecture

## Goal

Collect large, high-signal Reddit discussions, compress them into one short daily digest, and
publish both transcript and audio.

## Delivery path

1. `Reddit API` provides top threads and comments.
2. `OpenAI` turns filtered comments into structured summaries and a 600-700 word script.
3. `OpenAI TTS` renders the audio for the MVP.
4. `Supabase Database` stores sources, raw threads, comments, digests, and job logs.
5. `Supabase Storage` stores the final MP3.
6. `Next.js` renders the latest digest and archive pages.

## Why not AssemblyAI first

The current public AssemblyAI documentation clearly exposes transcription workflows, while a stable
general TTS endpoint is not obvious in the public docs used during this scaffold. Because of that,
the codebase includes an audio provider boundary and defaults to `OpenAI TTS` for a working MVP.
If you later confirm the exact AssemblyAI voice endpoint, it can be added behind the same provider
interface without changing the rest of the pipeline.

## Core database entities

- `sources`
- `threads`
- `comments`
- `digest_runs`
- `digests`
- `digest_items`
- `job_logs`

## Execution plan

The first production-safe sequence should be:

1. Pull active subreddits from `sources`.
2. Fetch top daily threads from Reddit.
3. Keep only high-signal posts and selected comments.
4. Build per-thread summaries.
5. Build one final podcast script.
6. Render audio and upload it to storage.
7. Mark the digest as published.
