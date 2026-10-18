/**
 * Règlement par défaut (repris du PDF 2025/2026, dates remplacées par des variables de saison).
 * Une ligne dans `rules_document` le remplace ; il reste disponible via « Texte par défaut ».
 */

export const RULES_VARIABLES = {
  edition: "Édition en cours (année de la finale, ex. 2027)",
  saison: "Saison sur deux années (ex. 2026/2027)",
  annee_precedente: "Année qui précède la finale (ex. 2026)",
  dates_auditions: "Dates des auditions (ex. samedi 30 janvier 2027 et dimanche 31 janvier 2027)",
  lieu: "Lieu des auditions",
  date_ouverture: "Ouverture des inscriptions (date et heure)",
  date_cloture: "Clôture des inscriptions (date et heure)",
  age_min: "Âge minimum",
  age_max: "Âge maximum (soliste ou moyenne du groupe)",
  age_max_membre: "Âge maximum d'un membre de groupe",
} as const

export type RulesVariable = keyof typeof RULES_VARIABLES

export const DEFAULT_RULES_TITLE = "Règlement du Tremplin Jeunes en Scène {{saison}}"

export const DEFAULT_RULES_BODY = `# 1 – Organisation

Le tremplin JEUNES EN SCÈNE est organisé par l'association PASS'MUSIQUE pour les musiciens interprètes entre {{age_min}} et {{age_max}} ans. C'est l'occasion de découvrir la nouvelle scène bretonne émergente.

Des informations sur toutes les activités du tremplin sont données sur :
- la page Instagram : Jeunes en scène – Bretagne
- le site Internet : www.tremplin-jeunes-en-scene.fr

Pour la session {{saison}} du tremplin JEUNES EN SCÈNE, vous pouvez vous inscrire en solo ou à plusieurs. Les sélections se dérouleront le {{dates_auditions}} ({{lieu}}) devant des jurés composés de musiciens, de programmateurs de festivals ou de chanteurs de la région brestoise, qui désigneront 6 finalistes parmi vous.

Des cours d'échauffement vocal auront lieu lors des présélections pour l'ensemble des chanteurs.

Nos 6 finalistes bénéficieront d'une pré-production (préparation artistique et scénique dans les conditions de la finale avec le suivi et les conseils de professionnels du milieu) courant mars {{edition}} afin de mieux se préparer à la finale. Ils s'engagent à assister aux rencontres que nous organiserons à cet effet.

La finale du tremplin JEUNES EN SCÈNE aura lieu en mai {{edition}} au Vauban (17 avenue Georges Clemenceau à Brest). Les 6 finalistes devront présenter un set de 20 minutes, dans le même registre que ce qu'ils auront présenté aux sélections.

Le soir même, un seul gagnant sera élu. Il aura la possibilité, s'il le souhaite, de participer à l'ouverture de plusieurs festivals, concerts ou évènements grâce à nos partenaires.

Dans le cadre de notre projet associatif à but non lucratif, nous tenons à préciser que la participation des artistes sur scène se fait à titre gracieux. Cette démarche s'inscrit dans notre mission de promotion de la culture et de soutien aux talents émergents, sans objectif de profit.

Nous souhaitons rappeler que le tremplin est spécifiquement destiné à la pratique amateur. Par conséquent, il s'adresse exclusivement aux artistes qui ne recherchent pas le statut d'intermittent du spectacle. Cette orientation permet de rester fidèle à notre mission de soutien et de promotion des talents amateurs, en offrant une plate-forme d'expression et de développement sans objectif de professionnalisation immédiate.

# 2 – Conditions d'inscription

- L'inscription au tremplin est gratuite.
- Le tremplin est ouvert à tous les musiciens interprètes âgés de {{age_min}} à {{age_max}} ans (pour les groupes, c'est la moyenne d'âge des interprètes qui sera prise en compte, cependant aucun participant du groupe ne doit dépasser l'âge de {{age_max_membre}} ans) résidant en Bretagne.
- Le dossier d'inscription au tremplin comprendra obligatoirement :
  - une autorisation parentale pour chaque artiste mineur au jour des auditions ;
  - un bulletin d'inscription correctement et complètement rempli pour chaque candidature (soliste ou groupe) ;
  - une fiche technique détaillée de la prestation prévue sur scène.
- Le dossier d'inscription est à envoyer avant le **{{date_cloture}}**, date de clôture des inscriptions.
- La candidature ne sera prise en compte par l'organisation du tremplin que si le dossier d'inscription reçu est complet au plus tard à la date de clôture des inscriptions.

# 3 – Conditions de participation

- Chaque groupe ou soliste candidat sera convoqué par l'association Pass'Musique afin qu'elle lui précise la date et l'heure de sa prestation de sélection et devra en retour confirmer à l'organisation du tremplin sa présence à cette convocation.
- Chaque artiste candidat devra se présenter devant le jury à la date prévue pour les sélections au moins 30 minutes avant l'heure de passage attribuée.
- Pour les sélections, la durée du set de chaque soliste ou groupe ne devra pas excéder 5 minutes (soit une prestation d'un seul titre, sauf demande des jurés).
- Pour la finale, la durée du set devra être de 20 minutes pour chaque soliste ou groupe.
- Les artistes pourront être amenés à être filmés, enregistrés ou photographiés durant leur prestation. En s'inscrivant au tremplin, les artistes candidats s'engagent à accepter l'utilisation et la diffusion de leur image.
- Chaque artiste candidat s'engage à respecter l'équipe d'organisation, les horaires et le matériel pendant toute sa participation aux activités du tremplin sous peine d'élimination du candidat à la finale.
- Les 6 finalistes s'engagent à assister et suivre tous les ateliers de pré-production.
- Les frais d'hébergement et de déplacement seront pris en charge par le candidat. Seul le catering sera offert par l'association.

# 4 – Conditions techniques des sélections et de la finale

- Une sonorisation, un éclairage, des micros, un ampli guitare électrique et un piano électronique seront mis à la disposition de tous les candidats par l'organisateur. Une batterie et un ampli basse seront mis à disposition uniquement pour les candidats de la catégorie « GROUPE ».
- Un technicien son sera à la disposition des candidats.
- Tout matériel supplémentaire sera pris en charge par le candidat.
- L'organisateur décline toute responsabilité quant au matériel appartenant aux candidats.
- Les bénévoles de l'association veilleront au bon déroulement des sélections et de la finale ainsi qu'au respect des horaires.

# 5 – Résultats des sélections et de la finale

- À l'issue des prestations de sélection, le jury se réunira à huis clos pour choisir les 6 candidats finalistes qui se produiront en finale.
- À l'issue des 6 prestations finales, le jury se réunira le soir même pour élire le gagnant.
- Les candidats du tremplin s'engagent à respecter les décisions des jurés des sélections et de la finale, qui sont irrévocables.
- Au moment des résultats et de l'élection du coup de cœur du public, si le candidat sélectionné par le jury est le même que celui du public, le coup de cœur du public reviendra au 2e candidat choisi par le public afin d'avoir deux gagnants.

# 6 – Demande de renseignements

Pour tout renseignement sur le tremplin JEUNES EN SCÈNE, les artistes sont invités à contacter l'association Pass'Musique :
- par la page Instagram : @tremplinjes
- par la page Facebook : Tremplin Jeunes en Scène
- par e-mail : passmusiquejes@gmail.com
- sur notre site Internet : www.tremplin-jeunes-en-scene.fr
`
