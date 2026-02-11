# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"Tremplin Jeunes en Scène" — a music festival registration platform for young musicians (ages 13–23) in Brittany, France. Built with Next.js 15 App Router, Supabase, and deployed on Vercel. All UI text is in French.

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm lint         # ESLint (next lint)
pnpm start        # Start production server
```

Package manager is **pnpm**. No test framework is configured.

## Architecture

### Stack

- **Next.js 15** (App Router) with **React 19** and **TypeScript**
- **Supabase** for PostgreSQL database, auth, and file storage
- **Tailwind CSS v4** with **shadcn/ui** (New York style, RSC-enabled)
- **react-hook-form** + **Zod** for form validation
- **nodemailer** for SMTP email sending (config stored in DB `smtp_config` table)
- **Vercel Blob** for file storage, **jszip/xlsx** for exports

### Path Alias

`@/*` maps to the project root (e.g., `@/components/ui/button`, `@/lib/supabase/server`).

### Auth Flow

Supabase Auth with email/password. No middleware auth checks — auth is handled in individual pages via server components. The `profiles` table has a `role` field (`admin` | `user`) for role-based access. After login, users are redirected based on role (`/admin` or `/dashboard`) via `lib/redirect-after-auth.ts`.

### Data Layer

Direct Supabase client queries (no ORM). Two client factories:
- `lib/supabase/server.ts` — server-side client with cookie-based sessions
- `lib/supabase/client.ts` — browser client singleton

Key tables: `profiles`, `applications`, `time_slots`, `technical_sheets`, `parental_authorizations`, `audition_tracking`, `smtp_config`. Row Level Security (RLS) policies enforce access control.

### API Routes (`app/api/`)

All business logic runs through App Router API routes:
- **Email**: `POST /api/email/send` — templated emails (welcome, application submitted, validation, time slot)
- **Uploads**: `/api/technical-sheet/upload`, `/api/parental-authorization/upload` (user + admin variants)
- **Applications**: `/api/application/delete`, `/api/applications/export`, `/api/admin/application/update`
- **Audition tracking**: `/api/admin/audition-tracking` (GET/POST)
- **Exports**: `/api/technical-sheets/download-all`

Admin API routes verify the user's role from Supabase auth before processing.

### Key Components

- `components/registration-form.tsx` — multi-step application form
- `components/admin-dashboard.tsx` — admin management interface
- `components/technical-sheet-form.tsx` — technical sheet form/upload
- `components/parental-authorization-upload.tsx` — parental auth document upload
- `components/ui/` — shadcn/ui primitives

### Database Migrations

SQL migration scripts live in `/scripts/` (numbered 019–024+). These are run manually against Supabase.

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key

SMTP configuration is stored in the `smtp_config` database table, not in env vars.

## Build Notes

`next.config.mjs` disables ESLint and TypeScript errors during builds (`ignoreDuringBuilds: true`, `ignoreBuildErrors: true`). Images are unoptimized.

## WIP — Migration Azure (CI/CD)

**Statut :** En cours, non fonctionnel.

La migration de Vercel vers Azure App Service est en cours. Le commit `4080b4e` a lancé la migration, suivi de 5 commits de fix (`540468a` → `e782a2f`).

**Infrastructure cible :**
- Azure App Service : `app-tremplin-jes` (resource group `rg-tremplin-jes`)
- Auth : Prisma + NextAuth (remplace Supabase Auth)
- Storage : Azure Blob Storage (remplace Vercel Blob)
- DB : PostgreSQL via `DATABASE_URL`

**Workflow CI/CD :** `.github/workflows/deploy.yml`
- Build Next.js standalone → zip → `az webapp deploy`
- Auth Azure via `AZURE_CREDENTIALS` (service principal JSON)
- Secrets requis : `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`, `AZURE_STORAGE_CONNECTION_STRING`

**Problèmes rencontrés et tentatives :**
1. `publish-profile` ne marchait pas → remplacé par `azure/login` avec credentials JSON
2. Extraction `node_modules` cassée sur Azure → passage à `az webapp deploy --type zip`
3. Ajout `WEBSITE_RUN_FROM_PACKAGE` + clean deploy
4. Symlinks pnpm non supportés → résolution avant zip
5. Dernier essai : hoisting des `node_modules` pour compatibilité Azure

**Prochaine étape :** Vérifier les logs Azure App Service pour identifier l'erreur runtime exacte après le dernier fix (`e782a2f`). Si ça ne marche toujours pas, envisager un output standalone avec les dépendances bundlées, ou passer à Azure Container Apps avec Docker.
