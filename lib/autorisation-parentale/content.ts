import { seasonLabel } from "@/lib/reglement/markup"
import { formatDateShortFr, getAgeReferenceDate, type SeasonConfigLike } from "@/lib/season"

/**
 * Texte du modèle d'autorisation parentale, rendu en PDF par `app/pdf/autorisation-parentale.pdf`.
 * La date « mineur au … » est la date de référence pour l'âge de la saison en cours (Paramètres),
 * la même que celle utilisée pour vérifier l'âge des candidats.
 * Module pur : testé avec Vitest. Syntaxe : celle du règlement (`lib/reglement/markup.ts`).
 */

const BLANK = "________________________________________"

export interface ParentalAuthorizationContent {
  title: string
  body: string
  filename: string
}

export function parentalAuthorizationContent(season: SeasonConfigLike): ParentalAuthorizationContent {
  const referenceDate = formatDateShortFr(getAgeReferenceDate(season))
  const body = [
    `**Saison ${seasonLabel(season.edition)}**`,
    `(remplir une autorisation par artiste candidat mineur au ${referenceDate})`,
    "",
    `Nom prénom du représentant légal : ${BLANK}`,
    "",
    `Date de naissance : ${BLANK}`,
    "",
    `Adresse : ${BLANK}`,
    "",
    `Téléphone : ${BLANK}`,
    "",
    `Je soussigné(e) ${BLANK},`,
    "",
    `père, mère, représentant légal (*) de ${BLANK},`,
    "",
    "déclare avoir pris connaissance du règlement complet du tremplin JEUNES EN SCÈNE organisé par l'association PASS'MUSIQUE, en accepter toutes les clauses dans son intégralité et autorise en conséquence la participation de l'enfant au tremplin Jeunes en Scène.",
    "",
    "Je déclare également céder les droits à l'image de mon enfant mineur.",
    "",
    "Si mon enfant est retenu pour la finale, je m'engage à être présent à Brest durant toute la durée de la finale pour assurer la surveillance et la responsabilité de celui-ci.",
    "",
    "(*) rayer les mentions inutiles.",
    "",
    "",
    "Fait le ____________________ à ______________________________",
    "",
    "**Signature :**",
  ].join("\n")

  return {
    title: "Autorisation parentale de participation au Tremplin JEUNES EN SCÈNE et droit à l'image",
    body,
    filename: `autorisation-parentale-${season.edition}.pdf`,
  }
}
