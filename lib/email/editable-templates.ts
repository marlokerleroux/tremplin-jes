/**
 * Modèles d'emails modifiables dans l'administration. Le texte par défaut vit ici ;
 * une ligne dans `email_templates` le remplace. Les variables disponibles sont documentées
 * par modèle et affichées dans l'interface.
 */

export const TEMPLATE_VARIABLES = {
  prenom: "Prénom du candidat (titulaire du compte)",
  nom: "Nom du candidat",
  nom_scene: "Nom de scène (artiste ou groupe)",
  edition: "Édition en cours (année de la finale)",
  date_audition: "Date de l'audition (ex. samedi 30 janvier 2027)",
  heure_audition: "Heure de passage (ex. 14:30)",
  lieu: "Lieu des auditions",
  lien_espace: "Lien vers l'espace candidat",
  pieces_manquantes: "Liste des pièces manquantes (une par ligne)",
  date_cloture: "Date et heure de clôture des inscriptions",
} as const

export type TemplateVariable = keyof typeof TEMPLATE_VARIABLES

export const EDITABLE_TEMPLATE_KEYS = [
  "application_validated",
  "application_rejected",
  "time_slot_assigned",
  "reminder_j7",
  "reminder_j1",
  "dossier_incomplete",
  "dossier_incomplete_final",
  "results_selected",
  "results_not_selected",
] as const

export type EditableTemplateKey = (typeof EDITABLE_TEMPLATE_KEYS)[number]

export interface EditableTemplateDefinition {
  key: EditableTemplateKey
  label: string
  description: string
  variables: TemplateVariable[]
  subject: string
  body: string
}

const BASE_VARIABLES: TemplateVariable[] = ["prenom", "nom", "nom_scene", "edition", "lien_espace"]
const AUDITION_VARIABLES: TemplateVariable[] = [...BASE_VARIABLES, "date_audition", "heure_audition", "lieu"]
const DOSSIER_VARIABLES: TemplateVariable[] = [...BASE_VARIABLES, "pieces_manquantes", "date_cloture"]

const SIGNATURE = "L'équipe du Tremplin Jeunes en Scène\nAssociation Pass'Musique"

export const EDITABLE_TEMPLATES: Record<EditableTemplateKey, EditableTemplateDefinition> = {
  application_validated: {
    key: "application_validated",
    label: "Candidature validée",
    description: "Envoyé quand l'administration valide un dossier complet.",
    variables: BASE_VARIABLES,
    subject: "Candidature validée - Tremplin Jeunes en Scène {{edition}}",
    body: `Bonjour {{prenom}},

Excellente nouvelle : la candidature de {{nom_scene}} à l'édition {{edition}} du Tremplin Jeunes en Scène a été validée par notre équipe. Votre dossier est complet et conforme.

Vous recevrez prochainement votre convocation avec la date et l'heure de votre audition. Vous pouvez suivre votre dossier à tout moment depuis votre espace candidat : {{lien_espace}}

Préparez-vous bien, nous avons hâte de vous voir sur scène !

${SIGNATURE}`,
  },
  application_rejected: {
    key: "application_rejected",
    label: "Candidature refusée",
    description: "Envoyé quand l'administration refuse une candidature (dossier non éligible ou incomplet).",
    variables: BASE_VARIABLES,
    subject: "Votre candidature au Tremplin Jeunes en Scène {{edition}}",
    body: `Bonjour {{prenom}},

Nous avons étudié avec attention la candidature de {{nom_scene}} à l'édition {{edition}} du Tremplin Jeunes en Scène. Malheureusement, nous ne pouvons pas la retenir cette année.

Nous vous remercions sincèrement pour l'intérêt que vous portez au tremplin et vous encourageons à retenter votre chance lors d'une prochaine édition.

Si vous avez une question sur cette décision, n'hésitez pas à nous écrire en répondant à cet email.

${SIGNATURE}`,
  },
  time_slot_assigned: {
    key: "time_slot_assigned",
    label: "Convocation à l'audition",
    description: "Envoyé à la validation du planning (ou à l'attribution d'un créneau si le planning est déjà validé). Une invitation calendrier est jointe automatiquement.",
    variables: AUDITION_VARIABLES,
    subject: "Votre convocation à l'audition - Tremplin Jeunes en Scène {{edition}}",
    body: `Bonjour {{prenom}},

Voici votre convocation pour l'audition de {{nom_scene}} :

Date : {{date_audition}}
Heure de passage : {{heure_audition}}
Lieu : {{lieu}}

Merci de vous présenter au moins 30 minutes avant votre heure de passage, avec votre matériel conforme à votre fiche technique. Une invitation à ajouter à votre agenda est jointe à cet email.

Retrouvez ces informations dans votre espace candidat : {{lien_espace}}

Nous avons hâte de vous voir sur scène, bonne préparation !

${SIGNATURE}`,
  },
  reminder_j7: {
    key: "reminder_j7",
    label: "Rappel une semaine avant l'audition",
    description: "Envoyé automatiquement 7 jours avant la date d'audition (planning validé).",
    variables: AUDITION_VARIABLES,
    subject: "Votre audition approche - Tremplin Jeunes en Scène {{edition}}",
    body: `Bonjour {{prenom}},

L'audition de {{nom_scene}} approche : rendez-vous le {{date_audition}} à {{heure_audition}}, {{lieu}}.

Quelques rappels pour bien la préparer :
- présentez-vous au moins 30 minutes avant votre heure de passage ;
- apportez votre matériel conformément à votre fiche technique ;
- en cas d'empêchement, prévenez-nous au plus vite en répondant à cet email.

Votre espace candidat : {{lien_espace}}

À très bientôt !

${SIGNATURE}`,
  },
  reminder_j1: {
    key: "reminder_j1",
    label: "Rappel la veille de l'audition",
    description: "Envoyé automatiquement la veille de la date d'audition (planning validé).",
    variables: AUDITION_VARIABLES,
    subject: "C'est demain ! Votre audition - Tremplin Jeunes en Scène {{edition}}",
    body: `Bonjour {{prenom}},

C'est demain ! L'audition de {{nom_scene}} a lieu le {{date_audition}} à {{heure_audition}}, {{lieu}}.

Merci d'arriver au moins 30 minutes avant votre heure de passage. En cas d'empêchement de dernière minute, prévenez-nous en répondant à cet email.

Bonne chance, et surtout prenez du plaisir sur scène !

${SIGNATURE}`,
  },
  dossier_incomplete: {
    key: "dossier_incomplete",
    label: "Relance : dossier incomplet",
    description:
      "Envoyé automatiquement à intervalle régulier (réglable dans Paramètres) aux candidats dont la fiche technique ou une autorisation parentale manque, jusqu'à la clôture des inscriptions.",
    variables: DOSSIER_VARIABLES,
    subject: "Votre dossier est incomplet - Tremplin Jeunes en Scène {{edition}}",
    body: `Bonjour {{prenom}},

Merci pour la candidature de {{nom_scene}} à l'édition {{edition}} du Tremplin Jeunes en Scène. Pour qu'elle puisse être étudiée, il manque encore à votre dossier :

{{pieces_manquantes}}

Attention : seuls les dossiers complets seront pris en compte. Vous avez jusqu'au {{date_cloture}} (clôture des inscriptions) pour déposer ces documents depuis votre espace candidat : {{lien_espace}}

Si vous avez une question ou une difficulté, répondez simplement à cet email.

${SIGNATURE}`,
  },
  dossier_incomplete_final: {
    key: "dossier_incomplete_final",
    label: "Relance : dernier rappel avant la clôture",
    description:
      "Envoyé une seule fois dans les derniers jours avant la clôture des inscriptions (réglable dans Paramètres) aux candidats dont le dossier est toujours incomplet.",
    variables: DOSSIER_VARIABLES,
    subject: "Dernier rappel : complétez votre dossier avant le {{date_cloture}} - Tremplin Jeunes en Scène",
    body: `Bonjour {{prenom}},

Les inscriptions au Tremplin Jeunes en Scène {{edition}} ferment le {{date_cloture}} et le dossier de {{nom_scene}} est toujours incomplet. Il manque :

{{pieces_manquantes}}

Seuls les dossiers complets à la clôture des inscriptions seront pris en compte : sans ces documents, votre candidature ne pourra pas être retenue.

Déposez-les dès maintenant depuis votre espace candidat : {{lien_espace}}

${SIGNATURE}`,
  },
  results_selected: {
    key: "results_selected",
    label: "Résultats : finaliste",
    description: "Envoyé aux candidats sélectionnés pour la finale, depuis l'onglet Résultats.",
    variables: BASE_VARIABLES,
    subject: "Félicitations, vous êtes finaliste ! - Tremplin Jeunes en Scène {{edition}}",
    body: `Bonjour {{prenom}},

Félicitations ! Le jury a retenu {{nom_scene}} parmi les finalistes de l'édition {{edition}} du Tremplin Jeunes en Scène.

Nous reviendrons très vite vers vous avec toutes les informations pratiques concernant la finale (date, lieu, répétitions, organisation).

Encore bravo pour votre prestation, et à très bientôt sur scène !

${SIGNATURE}`,
  },
  results_not_selected: {
    key: "results_not_selected",
    label: "Résultats : non retenu",
    description: "Envoyé aux candidats ayant passé l'audition mais non retenus pour la finale.",
    variables: BASE_VARIABLES,
    subject: "Résultats des auditions - Tremplin Jeunes en Scène {{edition}}",
    body: `Bonjour {{prenom}},

Merci d'avoir participé aux auditions de l'édition {{edition}} du Tremplin Jeunes en Scène avec {{nom_scene}}.

Le jury a eu la tâche difficile de départager des prestations de grande qualité. Malheureusement, {{nom_scene}} ne fait pas partie des finalistes retenus cette année.

Nous vous encourageons vivement à poursuivre votre projet musical et à retenter votre chance lors d'une prochaine édition. Nous serions ravis de vous revoir sur scène.

${SIGNATURE}`,
  },
}

export function isEditableTemplateKey(value: unknown): value is EditableTemplateKey {
  return typeof value === "string" && (EDITABLE_TEMPLATE_KEYS as readonly string[]).includes(value)
}

/** Données d'exemple pour l'aperçu dans l'administration. */
export const PREVIEW_VARIABLES: Record<TemplateVariable, string> = {
  prenom: "Léa",
  nom: "Le Gall",
  nom_scene: "Les Embruns",
  edition: "2027",
  date_audition: "samedi 30 janvier 2027",
  heure_audition: "14:30",
  lieu: "Espace Léo Ferré, Brest",
  lien_espace: "https://candidat.tremplin-jeunes-en-scene.fr/dashboard",
  pieces_manquantes: "- la fiche technique\n- l'autorisation parentale de Tom Le Gall (mineur)",
  date_cloture: "15 décembre 2026 à 23:59",
}
