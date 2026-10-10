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

## Test local du chatbot En coulisses

Le widget est optionnel et apparaît sur le site vitrine lorsque `NEXT_PUBLIC_CHATBOT_URL` est défini. Il est isolé dans une iframe ; la clé OpenRouter est conservée exclusivement par son backend.

Pour la copie de travail de ce fork, `.env.local` contient une connexion à une base PostgreSQL dédiée sur `127.0.0.1:54329`, ainsi que :

```dotenv
LOCAL_SITE_MODE=vitrine
NEXT_PUBLIC_CHATBOT_URL=http://127.0.0.1:3000
```

`LOCAL_SITE_MODE=vitrine` active la vitrine sur les hôtes locaux ; sans ce réglage, le comportement habituel de l’espace candidat est conservé. Utiliser **localhost** pour lancer Next.js : cela évite que sa normalisation d’URL traite une réécriture interne comme une redirection externe.

```bash
# Dans chatbot/ : installer et configurer le backend séparément
cd chatbot
npm ci
npm run build
npm start

# Dans un autre terminal, à la racine de ce dépôt : site vitrine
pnpm build
pnpm start --hostname localhost --port 3001
```

Ouvrir **http://localhost:3001**. Le backend du chatbot doit autoriser cette origine dans `ALLOWED_FRAME_ORIGINS`.

Les six migrations ont été appliquées uniquement à la base locale `tremplin_local`. Le script `node --env-file=.env.local tests/e2e/seed-local-preview.mjs` configure les dates publiques 2027 et conserve le palmarès 2026 inclus dans les migrations. Il refuse de s’exécuter sur une autre base. Aucun compte candidat ni accès à la base de production n’est nécessaire pour cet aperçu.

Sur le Mac préparé pour cette copie, redémarrer PostgreSQL au besoin avec :

```bash
/usr/local/opt/postgresql@15/bin/pg_ctl -D .local/postgres -l .local/postgres.log -o "-h 127.0.0.1 -p 54329 -k $(pwd)/.local/postgres-socket" start
```

Les réglages, mots de passe et données sous `.env.local` et `.local/` sont exclus de Git. Pour une intégration hébergée ultérieure, remplacer `NEXT_PUBLIC_CHATBOT_URL` par l’origine HTTPS du backend, puis reconstruire le site. L’absence de cette variable désactive le widget.

Le code complet du widget, de son backend RAG, du mode vocal et de l’import Supabase se trouve dans `chatbot/`. Voir `chatbot/README.md` pour la configuration, l’indexation et les tests. Les fichiers `.env*`, bases locales et captures sont exclus de la branche. L’import RAG est séparé des migrations Prisma et se limite au schéma `tremplin_chatbot`.

## Déploiement en ligne

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

6. **Après les auditions** (onglet **Résultats**) : cocher les finalistes, puis « Envoyer les résultats » informe par
   email chaque candidature validée (modèle « finaliste » ou « non retenu »).

Les emails sont envoyés par le serveur via la configuration SMTP renseignée dans l'onglet Paramètres. Les textes des
emails de validation, refus, convocation (avec invitation calendrier `.ics`), rappels J-7 / J-1 et résultats sont
modifiables dans **Paramètres › Modèles d'emails** (variables `{{prenom}}`, `{{nom_scene}}`, `{{date_audition}}`…).

### Vérification de l'adresse email

À l'inscription, le candidat reçoit un lien de confirmation ; tant que son adresse n'est pas confirmée, il ne peut pas
déposer de candidature (bandeau avec renvoi du lien et correction d'adresse). L'administration est prévenue par email
à chaque nouvelle candidature et dès qu'un dossier est complet.

### Rappels automatiques et tâche planifiée

`vercel.json` déclare une tâche quotidienne (`/api/cron/reminders`, 08:00 UTC) qui envoie les rappels J-7 et J-1 aux
candidats convoqués une fois le planning validé, nettoie la table de limitation de débit et maintient la base Supabase
active (le plan gratuit met la base en pause après une semaine sans requête). La variable `CRON_SECRET` doit être
définie sur Vercel (le bouton « Envoyer maintenant les rappels dus » de l'administration exécute la même logique).

### Documents imprimables (jury et jour J)

Depuis l'onglet Candidatures (bouton « Fiche » / « Fiches jury ») et l'onglet Mode Auditions (par journée) :
fiche candidat imprimable avec grille de notation vierge, et ordre de passage par journée d'audition.

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
  email/            # Templates, modèles modifiables, invitation .ics et envoi SMTP
  reminders.ts      # Règles des rappels J-7 / J-1 (pur, testé)
  results.ts        # Envoi des résultats des auditions
  blob-storage.ts   # Stockage privé Vercel Blob
  rate-limit.ts     # Limitation de débit (base de données)
  vitrine/          # Modes du site vitrine (règles pures) et chargement des données
middleware.ts       # Routage multi-domaine + protection des pages
prisma/
  schema.prisma     # Schéma de la base de données
  migrations/       # Migrations Prisma
```

## Licence

Projet privé — Association Pass'Musique.
