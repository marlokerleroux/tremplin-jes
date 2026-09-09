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
- **Zod** (validation des API), **Vitest** (tests unitaires)
- **Vercel** (hébergement) / **Vercel Blob** (stockage privé des PDF)

## Développement

```bash
pnpm install      # Installer les dépendances
cp .env.example .env.local   # puis renseigner les variables
pnpm db:migrate   # Appliquer les migrations Prisma
pnpm db:seed      # Créer le compte admin (SEED_ADMIN_PASSWORD obligatoire)
pnpm dev          # Serveur de développement
pnpm typecheck    # Vérification TypeScript
pnpm lint         # ESLint
pnpm test         # Tests unitaires (lib/season)
pnpm build        # Build de production (prisma generate + next build)
```

## Déploiement

Hébergé sur Vercel (projet `passmusique`). Le déploiement se fait automatiquement sur push vers `main`, ou manuellement :

```bash
vercel --prod
```

### Migrations de base de données

Le build Vercel (`vercel.json` → `pnpm run build:vercel`) exécute `prisma migrate deploy` avant `next build` : les
migrations en attente sont appliquées automatiquement à chaque déploiement, via la connexion directe
`POSTGRES_URL_NON_POOLING`. Un échec de migration fait échouer le build, ce qui évite de déployer un code incompatible
avec la base.

Si la base a été créée avant l'adoption de Prisma Migrate (table `_prisma_migrations` absente), marquez une fois la
migration initiale comme appliquée avant le premier déploiement :

```bash
npx prisma migrate resolve --applied 20260211203303_init
```

En local, `pnpm db:migrate` applique les migrations sur la base indiquée par `.env.local`.

### Stockage privé des documents (Vercel Blob)

Les fiches techniques et autorisations parentales sont envoyées avec `access: "private"` et servies uniquement via
les routes authentifiées `/api/documents/*`. Le mode d'accès est une propriété du **store** Vercel Blob : si le
projet est encore connecté à un store public, les nouveaux fichiers restent publics (un avertissement est journalisé).
Pour finaliser la mise en privé :

1. Créer un store privé : `vercel blob create-store tremplin-prive --access private --region cdg1` et le connecter au
   projet `passmusique` (tous les environnements). Cela remplace `BLOB_READ_WRITE_TOKEN`.
2. Conserver l'ancien jeton dans `BLOB_READ_WRITE_TOKEN_LEGACY` : il sert à supprimer les fichiers historiques lors
   d'un remplacement ou d'une purge d'édition. Les anciens fichiers restent lisibles via les mêmes routes.

## Gestion d'une saison (onglet **Paramètres** de l'administration)

1. **Ouvrir une nouvelle saison** : choisir l'édition (année de la finale). Les candidatures de l'édition précédente
   restent archivées et disparaissent de la vue courante ; les candidats gardent leur compte et peuvent candidater à
   nouveau.
2. **Configurer la saison** : dates d'ouverture et de clôture des inscriptions, dates d'audition, date de référence
   pour le calcul de l'âge (par défaut : dernière date d'audition), lieu.
3. **Générer les créneaux** d'audition par journée (heure de début, de fin, durée).
4. Pendant la saison : valider les candidatures (fiche technique et autorisations parentales requises), attribuer les
   créneaux en brouillon, puis **valider le planning** (envoi automatique des convocations par email).
5. **Archives** : export Excel et ZIP des fiches techniques par édition, puis purge définitive d'une édition passée
   (candidatures, fichiers, créneaux, comptes sans candidature) après la durée de conservation.

Les emails sont envoyés par le serveur via la configuration SMTP renseignée dans l'onglet Paramètres.

## Structure

```
app/
  vitrine/          # Site vitrine public
  (candidat)/       # Espace candidat (auth, dashboard, admin)
  api/              # Routes API (auth, candidatures, documents, admin)
components/
  admin/            # Interface d'administration (onglets, dialogues)
  vitrine/          # Composants du site vitrine
  ui/               # Composants shadcn/ui
lib/
  season.ts         # Règles de saison et d'éligibilité (pur, testé)
  season-config.ts  # Configuration de saison (serveur)
  validation/       # Schémas Zod partagés client/serveur
  email/            # Templates et envoi SMTP
  blob-storage.ts   # Stockage privé Vercel Blob
  rate-limit.ts     # Limitation de débit (base de données)
  vitrine/data.ts   # Données événement, finalistes, partenaires
middleware.ts       # Routage multi-domaine + protection des pages
prisma/
  schema.prisma     # Schéma de la base de données
  migrations/       # Migrations Prisma
```

## Licence

Projet privé — Association Pass'Musique.
