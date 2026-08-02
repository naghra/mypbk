# Mithaq — Halal Islamic Marriage Platform

Mithaq is a production-oriented Next.js 15 app for serious Muslim marriage (nikah). It intentionally avoids casual dating patterns: discovery uses **Interested / Skip**, messaging unlocks only after **mutual interest**, messages do not disappear, and explicit image sharing in chat is blocked.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui-style components
- Supabase (Auth, PostgreSQL, Storage, Realtime-ready)
- Prisma ORM
- React Hook Form + Zod
- Framer Motion
- next-themes (dark mode)
- EN / AR with RTL support
- Vercel-ready

## Features

- Auth: email/password, Google, Apple, phone OTP, mandatory email verification
- Profiles: full matrimonial fields, photos, preferences
- Verification: government ID + selfie, verified badge, AI fake heuristics
- Matching: religious, interest, lifestyle, personality, education, age scoring
- Discovery: Interested / Skip (no left/right swipe culture)
- Messaging: mutual interest only, AI text moderation, no disappearing messages
- Safety: report, block, spam/fake heuristics, content filtering
- Search: country, city, age, and premium advanced filters
- Notifications: in-app (+ hooks for email/push)
- Subscriptions: Free limited likes / Premium unlimited + who liked you + advanced filters + priority + read receipts
- Admin: users, reports, analytics, verifications, moderation, subscriptions, logs

## Getting started

```bash
npm install
cp .env.example .env.local
# Fill Supabase + DATABASE_URL + DIRECT_URL
npx prisma generate
npx prisma db push
# Or apply SQL: supabase/migrations/20260802090000_mithaq_schema.sql
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Supabase setup

1. Create a project and enable Email, Google, Apple, and Phone providers.
2. Set Auth redirect URL to `https://your-domain/auth/callback`.
3. Run the SQL migration (includes RLS + storage buckets).
4. Copy project URL, anon key, service role key, and Postgres connection strings into `.env.local`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Prisma generate + production build |
| `npm start` | Start production server |
| `npm run lint` | ESLint |
| `npm run db:push` | Push Prisma schema |
| `npm run db:studio` | Prisma Studio |

## Architecture

```
src/
  app/                # App Router pages + REST route handlers
  components/         # UI, layout, discover, auth, admin
  lib/
    auth/             # Session + user bootstrap
    matching/         # Compatibility scoring
    moderation/       # Text moderation + fake heuristics
    security/         # Rate limit + CSRF helpers
    supabase/         # Browser/server/admin clients
    validations/      # Zod schemas
    i18n/             # Locale helpers
prisma/schema.prisma  # Normalized PostgreSQL schema
supabase/migrations/  # SQL + RLS policies
```

## Security notes

- Supabase JWT session via `@supabase/ssr`
- Row Level Security policies in SQL migration
- Rate limiting on auth, interests, messages, reports
- Secure upload MIME/size checks
- Security headers in `next.config.ts`
- Admin routes require `ADMIN` / `MODERATOR` role

## Deploy

Deploy on Vercel, set all env vars from `.env.example`, and point Supabase Auth redirects at your production domain.
