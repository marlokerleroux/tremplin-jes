# Tremplin Jeunes en Scène

Plateforme d'inscription et site vitrine pour le Tremplin Jeunes en Scène, tremplin musical breton destiné aux jeunes artistes de 13 à 23 ans.

## Sites

- **Vitrine** : [tremplin-jeunes-en-scene.fr](https://tremplin-jeunes-en-scene.fr) — page d'accueil publique (finalistes, partenaires, billetterie)
- **Espace candidat** : [candidat.tremplin-jeunes-en-scene.fr](https://candidat.tremplin-jeunes-en-scene.fr) — inscription, candidature, espace admin

## Stack technique

- **Next.js 15** (App Router) / **React 19** / **TypeScript**
- **Prisma** ORM + **Supabase PostgreSQL**
- **NextAuth v5** (Credentials provider)
- **Tailwind CSS v4** + **shadcn/ui**
- **Vercel** (hébergement) / **Vercel Blob** (stockage fichiers)

## Développement

```bash
pnpm install      # Installer les dépendances
pnpm dev          # Serveur de développement
pnpm build        # Build de production
pnpm lint         # ESLint
```

## Déploiement

Hébergé sur Vercel (projet `passmusique`). Le déploiement se fait automatiquement sur push vers `main`, ou manuellement :

```bash
vercel --prod
```

## Structure

```
app/
  vitrine/          # Site vitrine public
  (candidat)/       # Espace candidat (auth, dashboard, admin)
  api/              # Routes API (auth, email, uploads, exports)
components/
  vitrine/          # Composants du site vitrine
  ui/               # Composants shadcn/ui
lib/
  vitrine/data.ts   # Données événement, finalistes, partenaires
  prisma.ts         # Client Prisma singleton
  auth-config.ts    # Configuration NextAuth
middleware.ts       # Routage multi-domaine (vitrine / candidat)
prisma/
  schema.prisma     # Schéma de la base de données
```

## Licence

Projet privé — Association Pass'Musique.
