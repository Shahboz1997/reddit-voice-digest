# Reddit Voice Digest

MVP scaffold for a product that turns large Reddit threads into short daily audio digests.

## Stack

- `Next.js` App Router
- `Supabase` Postgres, Auth, Storage, Edge Functions
- `OpenAI` for summarization and TTS
- `Reddit API` for ingestion
- `AssemblyAI` reserved behind an audio provider boundary

## What is already created

- Minimal audio-player dashboard homepage
- Digest detail page with original thread/comment links
- Settings page for personalized subreddit selection
- Interactive player UI with clickable timestamps
- TL;DR text cards below the player
- Archive sidebar with calendar-style issue links and keyword search
- Podcast RSS route at `/rss.xml`
- Supabase schema migration and seed file
- Reddit OAuth client scaffold
- OpenAI summary and TTS client scaffold
- Audio provider abstraction
- Supabase Edge Function entrypoint for the daily pipeline
- Preference API route for future Supabase Auth persistence
- Environment variable template

## Environment setup

Copy `.env.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `REDDIT_CLIENT_ID`
- `REDDIT_CLIENT_SECRET`
- `REDDIT_USER_AGENT`
- `DATABASE_URL`
- `DIRECT_URL`

Optional:

- `ASSEMBLYAI_API_KEY`
- `AUDIO_PROVIDER=assemblyai`

## Local commands

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run pipeline:run
npm run prisma:generate
```

## Supabase setup

```bash
npx supabase init
```

The repository already contains:

- `supabase/migrations/20260514013000_initial_schema.sql`
- `supabase/seed.sql`
- `supabase/functions/daily-pipeline/index.ts`

## Prisma setup

Prisma is an optional ORM layer alongside Supabase:

- `prisma/schema.prisma` — hand-maintained mirror of `supabase/migrations/`
- `lib/prisma.ts` — Prisma client (uses `DATABASE_URL`, port `6543`)

**Schema changes:** edit SQL in `supabase/migrations/`, apply with Supabase CLI, then update
`prisma/schema.prisma` to match and run `npm run prisma:generate`.

**Do not run** `prisma db pull` (RLS/comments on Supabase break introspection) or
`prisma migrate dev` / `prisma migrate reset` against the linked database (risk of drift/reset).

One-time baseline (after Supabase migrations are already applied):

```bash
npm run prisma:baseline
npm run prisma:generate
```

Env vars:

- `DATABASE_URL` — transaction pooler port `6543` with `?pgbouncer=true` (app runtime)
- `DIRECT_URL` — session pooler port `5432` (Prisma CLI only)

If `prisma db pull` previously created stray tables (`audioUrl`, `title`, etc.), drop them in the
Supabase SQL editor; they are not part of this app schema.

## Running the pipeline

The real integration path now lives in the Next.js app and can be triggered in two ways:

```bash
npm run pipeline:run
```

Optional flags:

```bash
npm run pipeline:run -- --subreddits=productivity,personalfinance,entrepreneur
npm run pipeline:run -- --date=2026-05-14
```

During local development only, you can also `POST` to `/api/pipeline/run`.

## Important note about audio

This scaffold uses `OpenAI TTS` as the working audio path because the current public AssemblyAI
documentation checked during setup clearly documents transcription, but not a stable general TTS
endpoint for this use case. The provider abstraction is ready, so the audio backend can be swapped
once the exact AssemblyAI contract is confirmed.
