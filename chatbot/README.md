> **Intégration au site Next.js / Vercel** : le build du dépôt parent compile ce widget
> sous `/chatbot/` et expose son API sous `/api/chatbot/`. Le serveur Express décrit
> ci-dessous est uniquement le mode autonome/local. Voir `../README.md` pour le
> déploiement intégré ; aucune URL externe du chatbot n'est nécessaire.

# En coulisses — Tremplin Jeunes en Scène

Un chatbot intégrable au site, aux couleurs de son logo. Fenêtre responsive, questions suggérées, réponses en Markdown avec titres en gras, liens vers les sources, reprise après erreur et nouvelle conversation. Le dossier contient également une page de démonstration dans le contexte visuel du site officiel.

## Utilisation locale

Prérequis : Node.js 22.13 ou plus récent.

```sh
npm install
# Sur une nouvelle installation seulement :
cp .env.example .env
# Renseigner OPENROUTER_API_KEY dans .env, puis :
npm run refresh
npm run dev
```

Sur ce Mac, `.env` est déjà configuré et la base déjà alimentée. Ne pas écraser ce fichier avec l’exemple.

- Démonstration : http://127.0.0.1:3000
- Chat seul : http://127.0.0.1:3000/chat
- État de la base : http://127.0.0.1:3000/api/health

Le serveur écoute uniquement sur `127.0.0.1` par défaut. La clé reste dans `.env` côté serveur, hors Git et hors fichiers livrés au navigateur. Les documents et les vecteurs restent dans SQLite local. **La génération et le calcul des embeddings utilisent l’API distante OpenRouter**, avec les questions et les extraits pertinents du site.

## Questions vocales

Le champ possède un seul bouton : micro quand il est vide, arrêt pendant l’enregistrement, flèche d’envoi dès qu’il contient du texte. Le vocal est transcrit dans le champ et peut être corrigé avant l’envoi. Un compteur indique la durée ; arrêt automatique à 60 secondes. Réduire la discussion, changer d’onglet ou appuyer sur Échap pendant le vocal annule la capture et coupe le micro.

La capture utilise `MediaRecorder` (WebM/Opus, MP4/AAC ou Ogg selon le navigateur), avec autorisation du micro uniquement au clic. HTTPS ou localhost est nécessaire. `public/widget.js` délègue l’accès au micro à l’origine du chatbot ; un éventuel en-tête `Permissions-Policy` du site hôte doit aussi autoriser cette origine.

`POST /api/transcribe` accepte au maximum 2 Mo, vérifie le type et la signature du fichier, puis utilise **`openai/whisper-large-v3-turbo` via OpenRouter**. Modèle configurable avec `TRANSCRIPTION_MODEL`. L’audio est traité en mémoire, sans fichier conservé par ce serveur. Le fournisseur reçoit l’audio pour la transcription, comme indiqué dans la notice du widget. Les limites de débit et le quota quotidien sont partagés avec les réponses : transcription puis réponse consomment deux demandes. Les erreurs de permission, de matériel ou de transcription permettent de revenir à la saisie texte.

Les tests de transcription utilisent une phrase française synthétique, sans capture du microphone, dans les formats WebM et M4A. Résultats dans `artifacts/audio-live-tests.json`. [Documentation de l’API de transcription](https://openrouter.ai/docs/guides/overview/multimodal/stt).

## Données et recherche

La collecte suit les liens publics internes et les sitemaps lorsqu’ils existent. Elle vérifie `robots.txt`, limite le débit, refuse les redirections externes et exclut les espaces de connexion, les comptes candidats, les API et l’administration. Les PDF publics liés sont pris en charge, lorsqu’ils contiennent du texte extractible. Pas de transcription des vidéos ni d’OCR des images.

État initial du 8 octobre 2026 : **7 documents publics, 19 passages vectorisés** : accueil 2027, À propos, Mentions légales, Confidentialité et trois PDF publics (règlement, autorisation parentale, exemples de fiches techniques). La collecte reconstitue les fragments HTML React/Next envoyés progressivement et récupère les biographies publiques des six finalistes depuis les données des fiches artistes. Les trois PDF ont été découverts dans le dépôt GitHub et sont ajoutés par `CRAWL_SEED_URLS`. Le règlement porte sur 2025/2026 et l’autorisation parentale comporte une date de 2025 : leur ancienneté est signalée au modèle, qui ne doit pas appliquer leurs conditions à 2027 sans confirmation actuelle. Aucun sitemap exploitable n’était publié. Ce périmètre couvre les pages publiques découvertes, pas d’éventuelles pages non liées ni les contenus derrière une connexion.

### Documents fournis par l’association

Quatre sources supplémentaires sont conservées sous forme de texte relu dans `knowledge/documents.json` : dossier d’inscription 2024–2025, informations pratiques des auditions, grille de notation et dossier de presse. Les fichiers originaux ne sont pas publiés ; le nom et l’empreinte SHA-256 de chaque original permettent de retrouver sa provenance.

À la demande du responsable, **les dates et périodes des événements présentes dans ces documents sont retirées**. Le calendrier du site officiel reste la référence exclusive. Le règlement 2024–2025 est conservé comme archive, avec un avertissement répété sur chaque passage pour éviter d’appliquer ses conditions à l’édition actuelle. Les colonnes des biographies et les critères de notation ont été extraits séparément afin de conserver leur sens. Les captures de presse historiques sont résumées, les photographies sans texte ne sont pas indexées.

`npm run index` fusionne systématiquement ces quatre sources avec la collecte du site ; `npm run refresh` ne les perd donc pas. Les documents transmis apparaissent par leur titre dans les sources des réponses, sans lien de téléchargement fictif ni chemin local. Le backend transmet les passages pertinents à OpenRouter pour répondre, comme les pages du site.

Fichiers générés, exclus de Git :

- `data/raw/` : réponses HTML/PDF originales ;
- `data/documents.json` : contenu textuel nettoyé et métadonnées ;
- `data/crawl-report.json` : pages, erreurs, exclusions et couverture ;
- `data/knowledge.sqlite` : documents, passages, recherche FTS5 et embeddings ;
- `data/index-report.json` : résultat de l’indexation.

`npm run refresh` refait la collecte et l’index. Les embeddings inchangés sont réutilisés. L’index est remplacé dans une transaction après réussite des embeddings. Une collecte partielle conserve les documents antérieurs ; une collecte vide ne les efface pas. L’actualisation est manuelle.

La recherche combine les résultats SQLite FTS5/BM25 et la similarité cosinus des embeddings, puis fournit les extraits au modèle. Les informations actuelles de la page d’accueil accompagnent systématiquement la recherche : les dates et lieux 2027 priment sur les indications génériques divergentes de « À propos ». L’assistant est invité à signaler une information absente et à ne citer que les pages effectivement utilisées. Cela réduit les erreurs sans garantir leur absence.

## Modèle et coût

Modèle retenu : **`google/gemini-3.1-flash-lite`** via OpenRouter. Le modèle Qwen évalué initialement a échoué au format structuré sur les questions réelles ; Gemini a été retenu pour la fiabilité de ses réponses sourcées.

Au 8 octobre 2026, le tarif affiché est de **0,25 USD/million de tokens en entrée et 1,50 USD/million en sortie** ([tarifs officiels](https://openrouter.ai/google/gemini-3.1-flash-lite)). Une réponse avec 3 000 tokens d’entrée et 250 tokens de sortie représente environ **0,001125 USD**, soit **1,13 USD pour 1 000 réponses**, hors variations et frais éventuels du fournisseur.

Embeddings : `openai/text-embedding-3-small`, **0,02 USD/million de tokens** ([tarifs officiels](https://openrouter.ai/openai/text-embedding-3-small/pricing)). Les vecteurs des documents sont calculés à l’indexation ; la question reçoit un embedding à chaque nouvelle recherche, avec un petit cache mémoire.

Le modèle est interchangeable dans `.env` via `CHAT_MODEL`. Les réponses sont limitées à 800 tokens, le contexte conversationnel est borné et le serveur autorise par défaut 300 demandes par jour. Ce quota est un nombre de requêtes, pas un plafond de facturation en dollars. Limites supplémentaires : 12 requêtes/minute par IP, 2 simultanées par IP, 8 globalement. Le compteur journalier persiste en SQLite.

## Intégration au site

La démo utilise déjà le vrai script d’intégration. Après hébergement du backend sous une URL HTTPS, ajouter avant `</body>` :

```html
<script src="https://VOTRE-DOMAINE-CHATBOT/widget.js" defer></script>
```

L’URL ci-dessus est un emplacement à remplacer. Aucun hébergement ni changement du site public n’a été effectué. Le widget s’ouvre au clic ; `data-open="true"` permet de l’ouvrir initialement sur ordinateur.

Le chat est isolé dans une iframe afin que les styles du site et du widget ne se perturbent pas. Le script calcule l’URL du backend depuis son propre `src`. Les échanges de redimensionnement vérifient l’origine et la fenêtre émettrice. Les domaines officiels autorisés à intégrer l’iframe sont définis par `ALLOWED_FRAME_ORIGINS`.

Pour déclencher le chat depuis un bouton du site :

```js
window.dispatchEvent(new Event('tremplin:open'));
```

Version construite :

```sh
npm run build
npm start
```

Pour l’hébergement futur : utiliser un serveur Node avec stockage persistant pour SQLite, HTTPS et une configuration de reverse proxy adaptée. Si un proxy est utilisé, configurer explicitement les adresses de confiance avant de s’appuyer sur la limite par IP. Le port et l’adresse d’écoute sont configurables via `PORT` et `HOST`. Ne jamais exposer `.env`, `server/` ou `data/` comme fichiers statiques.

## Vérification

```sh
npm test
npm run build
# Serveur démarré, consomme quelques requêtes OpenRouter :
node scripts/smoke.mjs
node scripts/smoke-documents.mjs
```

Tests unitaires : périmètre de collecte, extraction React/Next et biographies, découpage, validation des messages, similarité, FTS français et quota quotidien. Les tests réels vérifient inscriptions 2027, auditions, information non publiée, biographie et tentative de détournement. Leur résultat est enregistré dans `artifacts/live-tests.json`.

Les conversations restent en mémoire dans l’onglet et disparaissent au rechargement. Le serveur ne stocke ni les messages ni les réponses ; les rapports de tests contiennent uniquement les questions synthétiques utilisées pour la vérification. Une notice dans le widget explique le recours à l’IA et à OpenRouter. Le traitement côté fournisseur relève de ses propres conditions et paramètres.

## Index RAG sur Supabase

Le corpus a été enrichi le 8 octobre 2026 dans le projet Supabase `passmusique-candidatures` : **11 documents, 34 passages, 34 vecteurs**. Les 4 documents fournis apportent 15 nouveaux passages. La version précédente (7 documents, 19 passages) est conservée. Le backend local utilise désormais ce corpus via une fonction de lecture réservée au rôle serveur. La structure des 17 tables publiques préexistantes est restée identique avant/après l’import.

Le dossier `supabase/` contient une migration indépendante du site Next.js. L’import crée uniquement le schéma privé `tremplin_chatbot` et ses tables `datasets`, `documents`, `chunks`. Il ne lance aucune migration Prisma, ne modifie pas les tables du site et n’écrase pas les versions précédentes. Chaque index possède un identifiant SHA-256 ; relancer le même import ne crée pas de doublons. Une erreur annule toute la transaction. Un schéma du même nom appartenant à une autre application bloque l’import.

Les vecteurs de 1 536 dimensions sont stockés dans des tableaux PostgreSQL `real[]`, sans installer ni déplacer d’extension dans la base partagée. La recherche lexicale utilise l’index français PostgreSQL ; la similarité cosinus et la fusion des scores restent calculées par le backend, adaptées au petit corpus. Toutes les tables du chatbot ont RLS activé, sans accès accordé aux rôles API publics. `supabase/read-index.sql` ajoute la fonction `public.tremplin_chatbot_read_index`, utilisable uniquement par `service_role` et le propriétaire. Elle ne lit que notre schéma privé et ne modifie aucune donnée.

Créer un fichier `.env.supabase.local` exclu de Git avec `SUPABASE_DB_URL` (connexion PostgreSQL du projet) et `SUPABASE_CA_FILE=supabase/prod-ca-2021.crt`. Encoder les caractères spéciaux du mot de passe dans l’URL. La clé API `service_role` ne remplace pas ce mot de passe. Le certificat CA public inclus provient du [téléchargement officiel Supabase](https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt) ; la vérification TLS et du nom d’hôte restent activées. Les fichiers `.env` et `.env.supabase.local` ne doivent jamais être publiés.

**Accès via un compte invité et l’éditeur SQL** : `node scripts/export-supabase-sql.mjs` produit `artifacts/supabase-initial-import.sql`, à exécuter une seule fois dans l’éditeur SQL du projet. Il contient uniquement les documents publics, leurs vecteurs, le nouveau schéma et sa fonction de lecture. Il refuse un schéma ou une fonction déjà présents ; aucun remplacement implicite. Le SQL a été vérifié sur une base PostgreSQL jetable avant exécution distante.

Pour les ajouts suivants via le compte invité, `node scripts/export-supabase-sql.mjs --append` produit `artifacts/supabase-append.sql`. Le script ajoute une version complète dans le schéma signé du chatbot, conserve les versions précédentes, vérifie les comptes dans la transaction et ne recrée ni schéma ni fonction. Une relance du même script ne crée pas de doublon ; un index distant plus récent bloque l’import. Pour éviter la limite de taille de l’éditeur SQL, l’option `--reuse-index=/chemin/vers/sauvegarde.sqlite` réutilise dans PostgreSQL les passages inchangés d’une version déjà publiée ; le compte final fait échouer la transaction si cette version est absente.

Pour lire cet index sans mot de passe PostgreSQL, configurer côté serveur :

```dotenv
SUPABASE_TRANSPORT=rest
SUPABASE_URL=https://VOTRE-PROJET.supabase.co
SUPABASE_SERVICE_ROLE_KEY=VOTRE_CLE_SERVEUR
```

Puis lancer `npm run start:supabase`. La clé publique `anon` n’a pas accès à la fonction. La clé serveur ne quitte jamais le backend. Ce mode a été utilisé pour ce projet partagé, dont le mot de passe PostgreSQL fourni a été refusé.

```sh
npm run supabase:inspect  # Connexion et inventaire des structures, en lecture seule
npm run supabase:push     # Ajout transactionnel de l’index local, sans remplacement
npm run build
npm run start:supabase    # Backend local lisant le corpus distant
```

Le rapport d’import est écrit dans `artifacts/supabase-publish.json`. `npm start` conserve SQLite local par défaut ; `start:supabase` active explicitement le corpus distant. Les compteurs de requêtes restent dans le SQLite local du serveur : ce lancement est prévu pour une seule instance de backend. Supabase héberge ici les données ; l’application Node et le site nécessitent leur propre hébergement pour une mise en ligne.

Les tests PostgreSQL de `scripts/test-postgres.mjs` créent une base jetable sur le cluster de prévisualisation **127.0.0.1:54329 uniquement**, puis la suppriment. Ils vérifient import, idempotence, rollback, RLS, conservation d’une table extérieure et recherche. Ils refusent toute base distante.

## Organisation

- `src/` : React/TypeScript, interface et démonstration ;
- `public/widget.js` : intégration externe ;
- `server/` : API Express, SQLite, recherche et fournisseur IA ;
- `scripts/` : collecte, indexation et tests réels ;
- `tests/` : tests sans appel IA ;
- `public/assets/` : logo fourni, logo officiel et photo officielle de concert.

Les visuels proviennent du site de l’association et de la référence fournie. La page locale est un support de démonstration du chatbot.

## Test sur le vrai site forké

Le fork GitHub est disponible sur https://github.com/Whiskerweb/tremplin-jes et sa copie locale se trouve dans `site/` (dépôt Git séparé). Le site Next.js utilise une base PostgreSQL locale dédiée et affiche le widget sur http://localhost:3001. Le backend du chatbot reste sur http://127.0.0.1:3000. Voir `site/README.md` pour le lancement. Le code d’intégration est versionné dans le fork ; sa publication sur GitHub ne déploie pas le backend.
