# Reddit Voice Digest

Turn large Reddit threads into short daily audio digests.

## Quick start

1. Copy `.env.example` to `.env.local` and fill required keys.
2. `npx supabase db push`
3. `npm install && npm run db:setup && npm run prisma:generate && npm run dev`
4. `npm run pipeline:run` to create the first episode.

See `.env.example` for all variables. Health: `GET /api/health`.

## Production

Deploy to Vercel with `CRON_SECRET` set. On **Vercel Hobby**, only daily crons are allowed (`vercel.json` ships one: pipeline at 07:00 UTC). For delivery/job ticks every 5–10 minutes, use **Vercel Pro** or an external cron service that calls your API routes with the secret.

Do not use `prisma db pull`. Update `prisma/schema.prisma` after SQL migrations.
