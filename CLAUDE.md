# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"Tremplin Jeunes en Scène" — a music festival registration platform for young musicians (ages 13–23) in Brittany, France, with a public-facing vitrine site. Built with Next.js 15 App Router, Prisma + Supabase PostgreSQL, and deployed on Vercel (project name: `passmusique`). All UI text is in French.

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # prisma generate + next build (TypeScript errors fail the build)
pnpm typecheck    # tsc --noEmit
pnpm lint         # ESLint (flat config, eslint.config.mjs)
pnpm test         # Vitest unit tests (lib/**/*.test.ts)
tests/e2e/run.sh scenario         # Local end-to-end scenario (Postgres + fake SMTP + Playwright, see tests/e2e/run.sh)
tests/e2e/run.sh mobile-audit DIR # Mobile (390px) overflow audit of every page with long data, screenshots in DIR
pnpm db:migrate   # prisma migrate deploy
pnpm db:seed      # tsx prisma/seed.ts (requires SEED_ADMIN_PASSWORD)
pnpm start        # Start production server
```

Package manager is **pnpm**. Local Postgres can be used for development (see `.env.example`).

## Git Workflow

- Single branch: **`main`** (no develop branch)
- Deploy to production via `vercel --prod` or automatic on push to `main`
- Database migrations are applied manually before deploying (see README)

## Architecture

### Stack

- **Next.js 15** (App Router) with **React 19** and **TypeScript**
- **Prisma 6** ORM with **Supabase PostgreSQL** database
- **NextAuth v5** (Auth.js) for authentication with Credentials provider
- **Tailwind CSS v4** with **shadcn/ui** (New York style, RSC-enabled)
- **Zod 4** for validation, shared between client forms and API routes (`lib/validation/`)
- **nodemailer** for SMTP email sending (config stored in DB `smtp_config` table, editable in the admin UI). Candidate-facing emails (validation, rejection, convocation with `.ics` attachment, J-7/J-1 reminders, results) use editable templates: defaults in `lib/email/editable-templates.ts`, overrides in the `email_templates` table, plain-text bodies with `{{variables}}` rendered by `lib/email/template-engine.ts`
- **Vercel Blob** (private access) for PDF storage, served through authenticated `/api/documents/*` routes
- **sonner** for toasts, **jszip/xlsx** (SheetJS from cdn.sheetjs.com) for exports
- **Deployed on Vercel** (project: `passmusique`, scope: `marlo`)

### Multi-Domain Setup

Two domains pointing to the same Vercel deployment (project `passmusique`):
- `tremplin-jeunes-en-scene.fr` / `www.tremplin-jeunes-en-scene.fr` → **Vitrine** (public showcase site)
- `candidat.tremplin-jeunes-en-scene.fr` → **Espace candidat** (registration/admin app)

Routing is handled in `middleware.ts` based on hostname:
- Vitrine host: `/` rewrites to `/vitrine`, `/a-propos` rewrites to `/vitrine/a-propos`
- Candidat host: NextAuth middleware applies (`callbacks.authorized` in `lib/auth-config.edge.ts` protects `/dashboard`, `/apply`, `/technical-sheet`, `/parental-authorization`, `/admin`), `/vitrine` is blocked

### Path Alias

`@/*` maps to the project root (e.g., `@/components/ui/button`, `@/lib/prisma`).

### Auth Flow

NextAuth v5 with Credentials provider (`lib/auth-config.ts`, which extends the edge-safe `lib/auth-config.edge.ts`). Emails are normalised to lowercase; logins are rate limited (`lib/rate-limit.ts`, table `rate_limit_hits`). The `profiles` table has a `role` field (`admin` | `user`). After login, users are redirected based on role (`/admin` or `/dashboard`). API routes use `requireApiUser()` / `requireApiAdmin()` from `lib/auth-helpers.ts`.

### Email verification, results and reminders

- Signup sends a welcome email with a verification link (`/auth/verify-email?token=`). `profiles.email_verified_at` must be set before an application can be created (`/api/application/create` returns 403 otherwise); candidates can resend or correct their address via `/api/auth/resend-verification`. Accounts created before this feature were backfilled as verified.
- Admins are notified by email (all `admin` profiles) on each new application and when a dossier becomes complete (`lib/dossier.ts`).
- **Résultats** tab: `applications.is_finalist` + `result_sent_at`; `/api/admin/results/send` emails every validated application (finalist / not selected templates).
- Reminders: `/api/cron/reminders` (Vercel Cron, daily at 08:00 UTC, `CRON_SECRET` bearer auth) sends J-7 and J-1 emails once the schedule is validated (`lib/reminders.ts` rules, `lib/reminders-runner.ts`), cleans `rate_limit_hits`, and keeps the Supabase database awake. Admins can trigger the same run from Paramètres.
- Printable jury documents (admin only): `/admin/print/candidates?id=|date=|status=validated` (one sheet per candidate with a blank jury grid) and `/admin/print/day?date=` (running order).

### Seasons (éditions)

Everything season-specific lives in the single `schedule_config` row (`lib/season-config.ts`): `edition` (year of the final), registration window, audition dates, age reference date, venue, schedule validation flag. Applications and time slots carry an `edition` column; a profile can have one application per edition (`@@unique([user_id, edition])`). Eligibility and age rules are pure functions in `lib/season.ts` (unit tested). Admins manage seasons in the **Paramètres** tab (new season, dates, slot generation, SMTP, archives/purge by edition).

### Data Layer

**Prisma ORM** with PostgreSQL (Supabase-hosted). Schema in `prisma/schema.prisma`, migrations in `prisma/migrations/`.
- `lib/prisma.ts` — singleton PrismaClient
- `lib/admin-data.ts` — DTOs and queries for the admin UI

Key tables: `profiles`, `applications`, `time_slots`, `technical_sheets` (one per application), `parental_authorizations`, `audition_tracking`, `smtp_config`, `schedule_config`, `email_templates`, `password_reset_tokens`, `rate_limit_hits`.

### Vitrine Site (`app/vitrine/`)

Public-facing showcase site, driven by the database and the admin **Site vitrine** tab (no redeploy needed):
- `lib/vitrine/modes.ts` — the four display modes (`preseason`, `auditions`, `finale`, `aftermath`), auditions phase derived from season dates, finalist/tour-date normalisation (unit tested)
- `lib/vitrine/site.ts` — server loader (`getVitrineData`, deduped per request with React `cache`, no data cache so admin changes publish instantly); tables `vitrine_config` (mode, banner, intro texts), `vitrine_editions` (one row per edition: finale details, finalists JSON, winners, aftermath text/links, tour dates JSON), `vitrine_partners`, `vitrine_media`
- `app/vitrine/layout.tsx` (metadata + JSON-LD per mode) and `app/vitrine/page.tsx`, both `force-dynamic`; `components/vitrine/vitrine-site.tsx` composes sections per mode
- `app/vitrine/a-propos/page.tsx` — About page (static)
- Images uploaded from the admin are stored on the private Blob store and served publicly by `/api/vitrine/media/[id]` (immutable cache); repo images under `/images/vitrine/` still work
- Admin preview of any mode: `/admin/vitrine-preview?mode=…` (admin only, candidat host)
- Admin API: `/api/admin/vitrine` (GET all, PUT config), `/api/admin/vitrine/edition` (+ `/import-finalists` from the Résultats tab), `/api/admin/vitrine/partners`, `/api/admin/vitrine/media`

### API Routes (`app/api/`)

All business logic runs through App Router API routes; every write is validated with Zod and emails are sent server-side:
- **Auth**: `/api/auth/[...nextauth]`, `/api/auth/signup`, `/api/auth/forgot-password`, `/api/auth/reset-password`, `/api/auth/resend-verification`
- **Applications**: `/api/application/create`, `/api/application/delete`
- **Uploads**: `/api/technical-sheet/upload`, `/api/parental-authorization/upload` (+ `/api/admin/...` variants)
- **Documents** (authenticated PDF streaming): `/api/documents/technical-sheet/[applicationId]`, `/api/documents/parental-authorization/[applicationId]?member=N`
- **Admin**: `/api/admin/applications`, `/api/admin/applications/status`, `/api/admin/application/update`, `/api/admin/audition-tracking`, `/api/admin/season` (+ `/new`, `/validate`, `/reset`), `/api/admin/time-slots` (+ `/assign`, `/remove`), `/api/admin/smtp-config` (+ `/test`), `/api/admin/email-templates` (+ `/preview`, `/test`), `/api/admin/results` (+ `/send`), `/api/admin/reminders/run`, `/api/admin/editions` (+ `/[edition]` DELETE = purge)
- **Cron**: `/api/cron/reminders` (GET, `Authorization: Bearer $CRON_SECRET`)
- **Exports**: `/api/applications/export`, `/api/technical-sheets/download-all`

### Key Components

- `components/registration-form.tsx` — application form (single page, driven by season config)
- `components/signup-form.tsx` — account creation form
- `components/admin/` — admin dashboard split by tab (`applications-tab`, `schedule-tab`, `auditions-tab`, `results-tab`, `season-settings`, `smtp-settings`, `email-templates-panel`, `reminders-panel`, `editions-panel`) plus dialogs
- `components/registration-form.tsx` keeps a per-edition draft in `localStorage` (cleared on submit)
- `components/technical-sheet-upload.tsx`, `components/parental-authorization-upload.tsx` — PDF uploads
- `components/ui/` — shadcn/ui primitives

## Environment Variables

### Vercel Production

- `DATABASE_URL` — Supabase PostgreSQL connection string (pooled, with `?pgbouncer=true`)
- `POSTGRES_URL_NON_POOLING` — Direct connection (for migrations)
- `AUTH_SECRET` — NextAuth secret
- `AUTH_URL` — `https://candidat.tremplin-jeunes-en-scene.fr`
- `NEXT_PUBLIC_SITE_URL` — `https://candidat.tremplin-jeunes-en-scene.fr`
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob storage (+ `BLOB_READ_WRITE_TOKEN_LEGACY` for the old public store)
- `CRON_SECRET` — bearer secret sent by Vercel Cron to `/api/cron/reminders`

SMTP configuration is stored in the `smtp_config` database table, not in env vars. The legacy `NEXT_PUBLIC_SUPABASE_*` variables are no longer used.

## SEO / Robots

- Vitrine layout (`app/vitrine/layout.tsx`): `robots: { index: true, follow: true }`
- Espace candidat layout (`app/(candidat)/layout.tsx`): `robots: { index: false, follow: false }`
- Legal & privacy pages: `robots: { index: false, follow: false }`

## UI rules

- The candidate/admin layout (`app/(candidat)/layout.tsx`) sets `overflow-wrap: anywhere`; dialogs are portaled outside it, so give `DialogContent` the `[overflow-wrap:anywhere]` class. For free text use `wrap-anywhere` (not `break-words`, which does not shrink min-content inside grids/flex).
- Every page must render without horizontal overflow at 390px: run the mobile audit after UI changes.

## Build Notes

- TypeScript and ESLint errors are enforced (`next.config.mjs` no longer ignores them)
- Next.js image optimization is enabled with AVIF/WebP formats
- Deploy via `vercel --prod` (Vercel project: `passmusique`, scope: `marlo`)
