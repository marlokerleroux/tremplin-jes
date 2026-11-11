# Espace communication du Tremplin

## Intégration du 11 novembre 2026

Cette branche ajoute l’espace communication au `main` actuel de `marlokerleroux/tremplin-jes` (base `bbb43a4`), en conservant les fonctionnalités et les dépendances récentes du site. La compilation complète Next.js et les 93 tests unitaires passent. La migration Supabase et les variables serveur doivent encore être configurées avant activation ; cette branche ne les applique pas automatiquement et ne fusionne pas en production.

L’aperçu `/communication/preview`, disponible uniquement en développement, contient des questions fictives. Il désactive la validation RAG, la génération IA et la sauvegarde. Il ne remplace pas un test de connexion aux services de production.

## Fonctions

- Sur le domaine vitrine, `/admin` affiche l’espace communication. Sur le domaine candidat, l’administration des candidatures garde sa fonction actuelle.
- Connexion par mot de passe vérifié côté serveur, cookie HttpOnly/SameSite strict, durée de huit heures. Aucun mot de passe dans le code client.
- Questions et réponses horodatées, recherche, thèmes, périodes, statuts, pagination et export CSV de la page affichée.
- Questions sans information suffisante et erreurs de génération signalées comme « À compléter » ; la classification peut nécessiter une vérification humaine.
- Réponses validées par l’équipe vectorisées et stockées dans Supabase, ajoutées aux résultats RAG. Une nouvelle correction remplace les précédentes corrections actives de la même question. Retrait réversible : revalider la réponse pour la réactiver. Propagation du cache en une minute au maximum.
- Regroupement des questions identiques et thèmes ; pas de regroupement sémantique prétendant fusionner automatiquement les formulations proches.
- Brouillons Instagram/Facebook depuis une réponse disponible, modifiables, sauvegardables et copiables. Aucun connecteur de publication. « Marqué comme publié » est un statut interne.
- Les anciennes conversations ne sont pas reconstituées. Le suivi commence après activation. Les erreurs d’enregistrement sont signalées côté serveur sans texte des visiteurs ; une indisponibilité du stockage n’empêche pas le chatbot de répondre.

## Activation additive avant déploiement

1. Relire la branche et conserver les changements plus récents du dépôt courant avant fusion. Ne pas réimporter un ancien export local du site.
2. Vérifier le projet Supabase visé et les objets existants. Exécuter `chatbot/supabase/communication.sql` dans le projet du RAG. Le script exige la marque du schéma RAG existant, ajoute six tables `communication_*` privées et une fonction réservée au serveur ; il ne remplace ni le corpus ni les tables des candidatures. Il refuse une fonction ou une table homonyme qui n’a pas sa marque. Ne pas utiliser `prisma migrate reset`.
3. Ajouter les variables **serveur** `CHATBOT_ADMIN_PASSWORD_HASH` et `CHATBOT_ADMIN_SESSION_SECRET` à l’environnement de déploiement. Les valeurs sont préparées séparément du dépôt ; `scripts/create-communication-secret.mjs` produit `.local/communication-admin/admin.env`, fichier privé (mode 600, sous-dossier exclu de Git). Ne jamais publier ce fichier ni préfixer ces variables par `NEXT_PUBLIC_`. Garder les variables existantes Supabase/OpenRouter et l’`AUTH_SECRET` des candidatures inchangées.
4. Le serveur utilise `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` pour la fonction privée. Sans ces variables, il utilise la connexion Prisma existante. Le rôle doit pouvoir exécuter la fonction. Le mot de passe peut aussi être configuré via la table privée `communication_settings`, clé `password_hash`, mais la variable serveur prend priorité.
5. Lancer les tests, le build normal du projet et une prévisualisation Vercel. Vérifier `/admin` sur le domaine vitrine et l’administration candidat sur son domaine. Pour le site local complet, utiliser `LOCAL_SITE_MODE=vitrine`. L’aperçu intégré `/communication/preview` fonctionne seulement en développement sur l’hôte local hors mode vitrine ; il affiche une page introuvable en production (Next.js peut envoyer HTTP 200 lorsque la réponse est déjà diffusée).
6. Dans la prévisualisation, tester une vraie question puis sa présence dans l’historique, une correction et son utilisation par le chatbot, un brouillon et sa sauvegarde, le refus d’accès sans session, puis la déconnexion. Les vérifications distantes restent à réaliser après configuration de la base et de Vercel.

Pour préparer une autre configuration, `scripts/create-communication-secret.mjs` lit le mot de passe sur l’entrée standard et écrit uniquement son empreinte salée et un secret de session aléatoire. Il refuse d’écraser le fichier existant. Ne pas passer le mot de passe en argument de commande ou le committer. Une rotation de l’empreinte ou du secret invalide les sessions.

## Confidentialité et consommation

Le widget informe le visiteur que les questions/réponses sont conservées dans l’espace privé de l’association. Les adresses e-mail et numéros de téléphone français détectés sont masqués avant enregistrement. Cela n’est **pas** une anonymisation complète : un texte peut contenir un nom ou d’autres informations personnelles. Les voix ne sont pas enregistrées par cette fonctionnalité, seule la question transcrite est suivie. Les réponses validées et les références servant aux brouillons sont envoyées au fournisseur IA existant, OpenRouter. Les fichiers documentaires privés ne deviennent pas téléchargeables.

La connexion est limitée à cinq tentatives par clé d’origine en quinze minutes et soixante tentatives globales. Les préparations IA de l’espace admin sont limitées globalement à cinq par minute et cinquante par jour, y compris les vectorisations de réponses validées. Les quotas du chatbot public restent séparés. Le journal des tentatives est purgé après un jour ; aucune suppression automatique de l’historique ou des brouillons n’est configurée dans cette version.

## Modifications à intégrer

- Nouveaux dossiers `components/communication`, `lib/communication`, `app/communication`, `app/api/communication`.
- Nouveaux fichiers `chatbot/supabase/communication.sql`, `tests/communication-sql.integration.mjs`, `scripts/create-communication-secret.mjs` et ce document.
- `middleware.ts` : réécriture de `/admin` uniquement sur l’hôte vitrine.
- `lib/chatbot/handler.ts` et son test : enregistrement des réponses/erreurs.
- `lib/chatbot/knowledge.ts` : ajout des corrections actives au corpus lu.
- `chatbot/server/rag-core.mjs` : statut explicite des réponses et priorité des corrections de l’équipe, tout en conservant la FAQ anonyme validée antérieurement.
- `chatbot/src/App.tsx` : identifiant de conversation et information sur la conservation. Reconstruire le widget avec la commande habituelle du projet.

Les polices de l’admin sont celles déjà livrées dans `public/chatbot/assets`. Aucun nouveau service tiers ni police distante n’est ajouté.

## Vérifications effectuées localement

- 93 tests unitaires du dépôt actuel, dont 34 couvrant les modules concernés : sessions, protection des API, origine des requêtes, quotas, masquage des contacts, échec de vectorisation, corrections RAG, génération de brouillons et API du chatbot existant.
- Un test d’intégration PostgreSQL embarqué (PGlite) : installation répétable, historique, filtres, regroupements, corrections/remplacement/retrait, brouillons, quotas, droits anonymes refusés et conservation d’une table existante.
- Contrôles HTTP de la version compilée : connexion communication sur `/admin` du domaine vitrine, redirection vers la connexion candidat sur son domaine, API privée refusée sans session, aperçu de démonstration indisponible en production.
- Compilation complète du site Next.js 15.5.28, avec contrôle TypeScript et ESLint : réussie. Configuration de compilation sans accès à la base de production. Le warning préexistant concernant l’import `Users` de la page À propos est inchangé.
- Vérification visuelle et navigation sur 1440 px, 573 px et 390 px, recherche d’une question et ouverture/fermeture du détail. Captures de relecture conservées dans les artefacts locaux du projet.

Le test SQL est reproductible avec Node et `@electric-sql/pglite` installé dans un environnement de test ; `PGLITE_TEST_MODULE` peut pointer vers son module `dist/index.js`, puis exécuter `node --test tests/communication-sql.integration.mjs`. Il travaille exclusivement en mémoire et ne se connecte jamais à Supabase.
