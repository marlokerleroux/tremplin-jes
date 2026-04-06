# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"Tremplin Jeunes en Scène" — a music festival registration platform for young musicians (ages 13–23) in Brittany, France, with a public-facing vitrine site. Built with Next.js 15 App Router, Prisma + Supabase PostgreSQL, and deployed on Vercel (project name: `passmusique`). All UI text is in French.

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm lint         # ESLint (next lint)
pnpm start        # Start production server
```

Package manager is **pnpm**. No test framework is configured.

## Git Workflow

- Single branch: **`main`** (no develop branch)
- Deploy to production via `vercel --prod` or automatic on push to `main`

## Architecture

### Stack

- **Next.js 15** (App Router) with **React 19** and **TypeScript**
- **Prisma** ORM with **Supabase PostgreSQL** database
- **NextAuth v5** (Auth.js) for authentication with Credentials provider
- **Tailwind CSS v4** with **shadcn/ui** (New York style, RSC-enabled)
- **react-hook-form** + **Zod** for form validation
- **nodemailer** for SMTP email sending (config stored in DB `smtp_config` table)
- **Vercel Blob** for file storage, **jszip/xlsx** for exports
- **Deployed on Vercel** (project: `passmusique`, scope: `marlo`)

### Multi-Domain Setup

Two domains pointing to the same Vercel deployment (project `passmusique`):
- `tremplin-jeunes-en-scene.fr` / `www.tremplin-jeunes-en-scene.fr` → **Vitrine** (public showcase site)
- `candidat.tremplin-jeunes-en-scene.fr` → **Espace candidat** (registration/admin app)

Routing is handled in `middleware.ts` based on hostname:
- Vitrine host: `/` rewrites to `/vitrine`, `/a-propos` rewrites to `/vitrine/a-propos`
- Candidat host: NextAuth middleware applies, `/vitrine` is blocked

### Path Alias

`@/*` maps to the project root (e.g., `@/components/ui/button`, `@/lib/prisma`).

### Auth Flow

NextAuth v5 with Credentials provider (`lib/auth-config.ts`). Edge-compatible config in `lib/auth-config.edge.ts` (no Prisma/bcrypt). The `profiles` table has a `role` field (`admin` | `user`) for role-based access. After login, users are redirected based on role (`/admin` or `/dashboard`).

### Data Layer

**Prisma ORM** with PostgreSQL (Supabase-hosted). Schema in `prisma/schema.prisma`.
- `lib/prisma.ts` — singleton PrismaClient

Key tables: `profiles`, `applications`, `time_slots`, `technical_sheets`, `parental_authorizations`, `audition_tracking`, `smtp_config`, `schedule_config`, `password_reset_tokens`.

### Vitrine Site (`app/vitrine/`)

Public-facing showcase site with:
- `app/vitrine/page.tsx` — Landing page (hero, about, finalists, partners)
- `app/vitrine/a-propos/page.tsx` — About page (association history, press)
- `app/vitrine/layout.tsx` — Shared layout with navbar, footer, JSON-LD structured data
- `components/vitrine/` — All vitrine-specific components
- `lib/vitrine/data.ts` — Event data, finalists, partners

### API Routes (`app/api/`)

All business logic runs through App Router API routes:
- **Auth**: `/api/auth/[...nextauth]`, `/api/auth/signup`, `/api/auth/forgot-password`, `/api/auth/reset-password`
- **Email**: `POST /api/email/send` — templated emails
- **Uploads**: `/api/technical-sheet/upload`, `/api/parental-authorization/upload` (user + admin variants)
- **Applications**: `/api/application/create`, `/api/application/delete`, `/api/applications/export`, `/api/admin/application/update`
- **Audition tracking**: `/api/admin/audition-tracking` (GET/POST)
- **Exports**: `/api/technical-sheets/download-all`

Admin API routes verify the user's role via NextAuth session before processing.

### Key Components

- `components/registration-form.tsx` — multi-step application form
- `components/admin-dashboard.tsx` — admin management interface
- `components/technical-sheet-form.tsx` — technical sheet form/upload
- `components/parental-authorization-upload.tsx` — parental auth document upload
- `components/ui/` — shadcn/ui primitives

## Environment Variables

### Vercel Production

- `DATABASE_URL` — Supabase PostgreSQL connection string (pooled, with `?pgbouncer=true`)
- `POSTGRES_URL_NON_POOLING` — Direct connection (for migrations)
- `AUTH_SECRET` — NextAuth secret
- `AUTH_URL` — `https://candidat.tremplin-jeunes-en-scene.fr`
- `NEXT_PUBLIC_SITE_URL` — `https://candidat.tremplin-jeunes-en-scene.fr`
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase project (legacy, still used by some code)
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob storage

SMTP configuration is stored in the `smtp_config` database table, not in env vars.

## SEO / Robots

- Vitrine layout (`app/vitrine/layout.tsx`): `robots: { index: true, follow: true }`
- Espace candidat layout (`app/(candidat)/layout.tsx`): `robots: { index: false, follow: false }`
- Legal & privacy pages: `robots: { index: false, follow: false }`

## Build Notes

- `next.config.mjs` disables ESLint and TypeScript errors during builds (`ignoreDuringBuilds: true`, `ignoreBuildErrors: true`)
- Next.js image optimization is enabled with AVIF/WebP formats
- Deploy via `vercel --prod` (Vercel project: `passmusique`, scope: `marlo`)
