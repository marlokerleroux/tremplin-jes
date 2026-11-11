# Marlo — activer l’espace communication du chatbot

Le code est prêt dans la [PR nº 12](https://github.com/marlokerleroux/tremplin-jes/pull/12), branche **`codex/communication-admin`**. Il ajoute l’historique des questions, les réponses à compléter, les corrections intégrées au RAG et les brouillons de posts.

**Au 11 novembre 2026 :** 93 tests, le test SQL et la compilation complète passent. La PR est en brouillon, sans fusion dans `main`. **La migration Supabase et les nouvelles variables Vercel n’ont pas été appliquées.** Lucas n’a plus accès au projet Supabase ; la suite est à faire depuis tes comptes.

Ordre conseillé : **nouveau commit avec ton compte → prévisualisation Vercel → Supabase → variables et redéploiement → vérifications → fusion en production**. La première prévisualisation ne permettra pas encore d’utiliser l’admin tant que la base et les variables ne sont pas configurées.

## 1. Relancer Vercel depuis ton compte GitHub

Le blocage observé concernait l’auteur du commit. **Repousser le même commit ne change pas son auteur.** Vercel vérifie le lien entre le compte GitHub de l’auteur et le propriétaire du projet Hobby. Sa documentation distingue également les dépôts privés des dépôts publics : ce n’est pas une interdiction générale de toute collaboration sur un dépôt public. [Règles officielles Vercel](https://vercel.com/docs/deployments/troubleshoot-project-collaboration).

1. Connecte-toi à GitHub avec **`marlokerleroux`**, puis au compte Vercel propriétaire du projet [passmusique](https://vercel.com/marlo/passmusique/deployments).
2. Dans les réglages de **ton compte Vercel**, vérifie que ce compte GitHub est lié dans **Authentication / Login Connections**. Dans **Settings → Git** du projet, vérifie le dépôt connecté : **`marlokerleroux/tremplin-jes`**.
3. Sur GitHub, ouvre [ce fichier sur la branche](https://github.com/marlokerleroux/tremplin-jes/blob/codex/communication-admin/POUR_MARLO.md), clique sur le crayon et complète la ligne « Reprise par Marlo » en bas du document. Enregistre directement sur **`codex/communication-admin`**, depuis ton compte. Cela crée un nouveau commit dont tu es réellement l’auteur, tout en conservant les changements précédents.
4. Dans Vercel, vérifie qu’une **Preview** est lancée pour cette branche et que le commit affiché est bien le tien. Si elle n’est pas lancée automatiquement, utilise **Create Deployment** avec cette branche ou son nouveau commit. Ne relance pas l’ancien déploiement de `main`.
5. Si le blocage d’auteur persiste, vérifie l’auteur affiché sur le nouveau commit GitHub et la connexion de ce même compte à Vercel. Ne réécris pas l’historique et ne force pas le push.

Garde la PR ouverte pendant la configuration ci-dessous. Les éventuels conflits avec des changements récents de `main` doivent être résolus en conservant ces changements, sans réimporter une ancienne copie du site.

## 2. Appliquer la migration Supabase

### Vérifier le projet

Ouvre le [projet Supabase du RAG](https://supabase.com/dashboard/project/mcwhmljdovnusjuyzpij), référence **`mcwhmljdovnusjuyzpij`**. Vérifie que c’est bien le projet utilisé par le chatbot dans la configuration Vercel. Si le projet a été déplacé, retrouve d’abord la base actuelle ; ne crée pas une base vide pour remplacer l’existante.

Dans **SQL Editor**, ouvre une nouvelle requête et exécute ce contrôle en lecture seule :

```sql
SELECT obj_description(oid, 'pg_namespace') AS rag_schema_marker
FROM pg_namespace
WHERE nspname = 'tremplin_chatbot';
```

Résultat attendu : **`Tremplin En coulisses RAG schema v1`**. Si la ligne est absente ou différente, arrête-toi et vérifie le projet ; ne modifie pas la marque pour passer le contrôle.

### Exécuter le fichier préparé

1. Ouvre [chatbot/supabase/communication.sql](chatbot/supabase/communication.sql) sur cette branche.
2. Copie son contenu complet, de **`BEGIN;` jusqu’à `COMMIT;` inclus**, dans une nouvelle requête SQL Editor. Exécute l’ensemble avec le rôle administrateur de la base.
3. Vérifie que l’exécution se termine sans erreur. Ne sélectionne pas seulement une partie du script.

Le script ajoute six tables privées `communication_*` dans `tremplin_chatbot` et la fonction serveur `public.tremplin_communication`. Il n’importe aucun document, ne vide pas le RAG et ne modifie pas les tables des candidatures. Il contrôle les objets homonymes, s’exécute dans une transaction et peut être relancé sur ses propres objets sans effacer les données.

En cas d’erreur `Existing chatbot schema must be installed first`, vérifie la base cible. En cas d’objet existant non reconnu, conserve-le et fais examiner le conflit. **Ne supprime pas de table, ne retire pas les contrôles et n’utilise pas `supabase db reset` ni `prisma migrate reset`.**

Cette migration est un fichier SQL dédié : le déploiement Vercel ou `prisma migrate deploy` ne l’exécute pas automatiquement. Supabase fournit un [SQL Editor dans son tableau de bord](https://supabase.com/docs/guides/database/overview).

### Vérifier le résultat

Exécute ces contrôles en lecture seule après la migration :

```sql
SELECT c.relname AS table_name,
       c.relrowsecurity AS rls_enabled,
       has_table_privilege('anon', c.oid, 'SELECT') AS anonymous_read,
       has_table_privilege('authenticated', c.oid, 'SELECT') AS authenticated_read
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'tremplin_chatbot'
  AND c.relkind = 'r'
  AND c.relname IN (
    'communication_settings', 'communication_questions',
    'communication_answers', 'communication_drafts',
    'communication_login_attempts', 'communication_ai_requests'
  )
ORDER BY c.relname;

SELECT
  has_function_privilege('service_role', 'public.tremplin_communication(text,jsonb)', 'EXECUTE') AS server_access,
  has_function_privilege('anon', 'public.tremplin_communication(text,jsonb)', 'EXECUTE') AS anonymous_access,
  has_function_privilege('authenticated', 'public.tremplin_communication(text,jsonb)', 'EXECUTE') AS authenticated_access;

SELECT public.tremplin_communication('dashboard', '{"days":30}'::jsonb)->'stats' AS dashboard_stats;
```

Attendu : **6 tables**, toutes avec `rls_enabled = true`, les deux accès de lecture à `false`. Pour la fonction : `server_access = true`, les deux autres accès à `false`. La dernière requête renvoie les compteurs du tableau de bord ; ils peuvent être à zéro au démarrage. Elle ne renvoie pas le texte des questions.

## 3. Ajouter les variables dans Vercel

Dans **passmusique → Settings → Environment Variables**, ajoute les deux variables **côté serveur**, pour **Preview et Production** :

| Variable | Valeur à utiliser |
| --- | --- |
| `CHATBOT_ADMIN_PASSWORD_HASH` | Empreinte du mot de passe produite par le script ci-dessous ; jamais le mot de passe en clair. |
| `CHATBOT_ADMIN_SESSION_SECRET` | Secret aléatoire produit par le même script. |

Lucas a une configuration privée préparée localement : il peut te transmettre les deux valeurs par un canal privé. Elles ne figurent pas dans GitHub. Tu peux aussi les générer sur ta machine avec le mot de passe convenu, communiqué séparément.

Pour générer les valeurs, récupère cette branche dans une copie locale à jour, place-toi à la racine du dépôt avec Node.js 22 disponible, puis exécute :

```bash
bash <<'BASH'
read -r -s -p 'Mot de passe admin : ' JES_ADMIN_PASSWORD </dev/tty
printf '\n' >/dev/tty
printf '%s' "$JES_ADMIN_PASSWORD" | node scripts/create-communication-secret.mjs
unset JES_ADMIN_PASSWORD
BASH
```

La saisie est masquée. Le script crée **`.local/communication-admin/admin.env`**, exclu de Git, avec uniquement l’empreinte et le secret. Ouvre ce fichier localement pour copier les deux valeurs dans Vercel ; ne le joins pas à la PR. Si le fichier existe déjà, le script refuse de l’écraser : réutilise les valeurs existantes si c’est bien la configuration choisie.

Vérifie aussi la présence de **`SUPABASE_URL`** et **`SUPABASE_SERVICE_ROLE_KEY`** du projet RAG dans ces environnements. La clé serveur n’est pas la clé `anon`. Si le site utilise déjà la connexion PostgreSQL via Prisma à la place de ces deux variables, elle doit viser la même base et pouvoir exécuter la fonction privée. Conserve la configuration OpenRouter et les variables des candidatures existantes.

Ne préfixe aucune de ces clés par `NEXT_PUBLIC_`. Après enregistrement, relance la **Preview de ton nouveau commit** : les nouvelles variables ne s’appliquent pas aux déploiements déjà construits. [Fonctionnement des variables Vercel](https://vercel.com/docs/environment-variables).

## 4. Vérifier puis mettre en production

Sur l’URL de prévisualisation **`*.vercel.app`**, ouvre **`/communication`** pour tester le nouvel espace. Sur cet hôte, `/admin` reste celui des candidatures. Après mise en production, **`https://www.tremplin-jeunes-en-scene.fr/admin`** ouvrira l’espace communication ; le domaine candidat gardera son administration actuelle.

Vérifications avant fusion :

- Le bon mot de passe permet d’entrer ; un mauvais mot de passe est refusé.
- Sans session, `/api/communication/data` renvoie un refus d’accès, sans historique.
- Une question envoyée au chatbot de cette même prévisualisation apparaît dans l’historique avec sa date et sa réponse. Les questions anciennes ne seront pas récupérées rétroactivement.
- Une réponse validée dans l’admin est utilisée par le chatbot, avec une propagation du cache pouvant prendre jusqu’à une minute. Utilise une vraie information approuvée, pas un fait fictif dans le RAG partagé.
- Un brouillon peut être généré, modifié et sauvegardé ; rien n’est publié automatiquement sur les réseaux.
- La déconnexion coupe l’accès aux données. Le site vitrine et l’espace candidat fonctionnent toujours.

Quand ces contrôles passent, marque la PR comme prête et fusionne-la dans `main` **depuis ton compte**, avec un nouveau commit de fusion. Vérifie l’auteur du commit de production dans Vercel, l’état **Ready**, puis refais les contrôles sur les domaines réels. Ne promeus pas un ancien déploiement de `main`.

En cas de problème après mise en ligne, reviens au précédent déploiement Vercel. Laisse les nouvelles tables en place pour préserver les questions et corrections ; supprimer la base n’est pas nécessaire au retour arrière.

## Suivi à compléter par Marlo

- Reprise par Marlo : **à compléter avec la date du nouveau commit**.
- Migration Supabase exécutée et contrôlée : **à faire**.
- Variables Preview et Production configurées : **à faire**.
- Parcours validé en prévisualisation : **à faire**.
- Fusion et déploiement de production : **à faire**.

Les détails de fonctionnement et les limites connues sont dans [COMMUNICATION.md](COMMUNICATION.md).
