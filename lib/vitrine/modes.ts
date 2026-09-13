/**
 * Modes d'affichage du site vitrine et règles associées. Module pur (testé avec Vitest),
 * partagé entre le site, l'administration et le serveur.
 */
import { getRegistrationStatus, isIsoDate, type SeasonConfigLike } from "@/lib/season"

export const VITRINE_MODES = ["preseason", "auditions", "finale", "aftermath"] as const
export type VitrineMode = (typeof VITRINE_MODES)[number]

export const VITRINE_MODE_LABELS: Record<VitrineMode, { label: string; description: string }> = {
  preseason: {
    label: "Avant-ouverture",
    description: "Annonce de la prochaine édition, date d'ouverture des inscriptions, palmarès de l'édition précédente.",
  },
  auditions: {
    label: "Auditions",
    description:
      "Le site explique comment participer : conditions, étapes, dates des auditions, bouton vers l'espace candidat. Suit automatiquement l'ouverture et la clôture des inscriptions.",
  },
  finale: {
    label: "Finale",
    description: "Compte à rebours, billetterie, présentation des finalistes et des prix.",
  },
  aftermath: {
    label: "Après la finale",
    description: "Lauréats, remerciements, tournée des festivals de l'été, retour en vidéo et en photos.",
  },
}

export function isVitrineMode(value: unknown): value is VitrineMode {
  return typeof value === "string" && (VITRINE_MODES as readonly string[]).includes(value)
}

export interface FinalistEntry {
  id: string
  name: string
  genre: string
  description: string
  image: string
  youtubeId: string
}

export interface TourDate {
  date: string // YYYY-MM-DD
  name: string
  city: string
  url: string
}

function str(value: unknown): string {
  return typeof value === "string" ? value : ""
}

/** Normalise le JSON `finalists` d'une édition (données saisies dans l'administration). */
export function normalizeFinalists(value: unknown): FinalistEntry[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((f): f is Record<string, unknown> => typeof f === "object" && f !== null)
    .map((f, index) => ({
      id: str(f.id) || `finaliste-${index + 1}`,
      name: str(f.name),
      genre: str(f.genre),
      description: str(f.description),
      image: str(f.image),
      youtubeId: str(f.youtubeId),
    }))
    .filter((f) => f.name)
}

export function normalizeTourDates(value: unknown): TourDate[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((d): d is Record<string, unknown> => typeof d === "object" && d !== null)
    .map((d) => ({ date: str(d.date), name: str(d.name), city: str(d.city), url: str(d.url) }))
    .filter((d) => d.name)
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Phase du mode « auditions », déduite des dates de la saison :
 * avant l'ouverture, inscriptions ouvertes, closes avant les auditions, auditions en cours, après les auditions.
 */
export type AuditionsPhase = "not_yet_open" | "open" | "closed" | "running" | "finished"

export function getAuditionsPhase(season: SeasonConfigLike, now: Date, todayIso: string): AuditionsPhase {
  const registration = getRegistrationStatus(season, now)
  if (registration === "not_yet_open") return "not_yet_open"
  if (registration === "open") return "open"
  const dates = [...(season.audition_dates ?? [])].filter(isIsoDate).sort()
  if (dates.length === 0) return "closed"
  const first = dates[0]
  const last = dates[dates.length - 1]
  if (todayIso < first) return "closed"
  if (todayIso <= last) return "running"
  return "finished"
}

/** Identifiant YouTube à partir d'une URL ou d'un identifiant brut. */
export function extractYoutubeId(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ""
  const match = /(?:youtu\.be\/|v=|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{6,})/.exec(trimmed)
  if (match) return match[1]
  return /^[A-Za-z0-9_-]{6,}$/.test(trimmed) ? trimmed : ""
}
