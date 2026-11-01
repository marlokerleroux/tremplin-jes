import { isMinorAt } from "@/lib/season"
import { daysUntil, todayInParis } from "@/lib/reminders"

/**
 * Relances des dossiers incomplets (fiche technique et/ou autorisations parentales manquantes).
 * Module pur, testé avec Vitest : la tâche quotidienne (lib/dossier-reminders-runner.ts) s'appuie dessus.
 */

export const DOSSIER_REMINDER_DEFAULTS = { enabled: true, intervalDays: 7, finalDays: 3 } as const
export const DOSSIER_REMINDER_LIMITS = { intervalDays: { min: 2, max: 30 }, finalDays: { min: 0, max: 14 } } as const
/** Délai minimal entre l'envoi de la candidature et la première relance (le candidat vient d'être informé). */
export const DOSSIER_REMINDER_GRACE_DAYS = 2

export interface DossierMember {
  firstName: string
  lastName: string
  birthDate: string
}

export interface MissingDocuments {
  technicalSheet: boolean
  /** Membres mineurs sans autorisation parentale. */
  parentalAuthorizations: Array<{ index: number; name: string }>
}

/** Pièces manquantes : fiche technique, puis une autorisation parentale par membre mineur à la date de référence. */
export function getMissingDocuments(input: {
  members: DossierMember[]
  hasTechnicalSheet: boolean
  providedAuthorizations: Iterable<number>
  ageReferenceDate: string
}): MissingDocuments {
  const provided = new Set(input.providedAuthorizations)
  return {
    technicalSheet: !input.hasTechnicalSheet,
    parentalAuthorizations: input.members.flatMap((member, index) =>
      member.birthDate && isMinorAt(member.birthDate, input.ageReferenceDate) && !provided.has(index)
        ? [{ index, name: `${member.firstName} ${member.lastName}`.trim() || `membre ${index + 1}` }]
        : [],
    ),
  }
}

export function isComplete(missing: MissingDocuments): boolean {
  return !missing.technicalSheet && missing.parentalAuthorizations.length === 0
}

/** Liste à puces (texte brut) des pièces manquantes, pour la variable `{{pieces_manquantes}}`. */
export function formatMissingDocuments(missing: MissingDocuments, isGroup: boolean): string {
  const lines: string[] = []
  if (missing.technicalSheet) lines.push("- la fiche technique")
  for (const member of missing.parentalAuthorizations) {
    lines.push(isGroup ? `- l'autorisation parentale de ${member.name} (mineur)` : "- l'autorisation parentale (candidat mineur)")
  }
  return lines.join("\n")
}

export type DossierReminderKind = "regular" | "final"

export interface DossierReminderSettings {
  enabled: boolean
  intervalDays: number
  finalDays: number
}

/**
 * Relance due aujourd'hui pour un dossier incomplet (dates calendaires, heure de Paris) :
 * - aucune sans date de clôture, ou une fois la clôture passée ;
 * - jamais dans les {@link DOSSIER_REMINDER_GRACE_DAYS} jours qui suivent l'envoi de la candidature ;
 * - relance renforcée (« final ») une seule fois dans les `finalDays` derniers jours avant la clôture,
 *   au moins deux jours après la relance précédente ;
 * - sinon relance régulière tous les `intervalDays` jours depuis la candidature ou la dernière relance.
 */
export function dueDossierReminder(input: {
  now: Date
  closesAt: Date | null
  submittedAt: Date
  lastSentAt: Date | null
  settings: DossierReminderSettings
}): DossierReminderKind | null {
  const { now, closesAt, submittedAt, lastSentAt, settings } = input
  if (!settings.enabled || !closesAt || now >= closesAt) return null
  const today = todayInParis(now)
  const sinceSubmission = -(daysUntil(todayInParis(submittedAt), today) ?? 0)
  if (sinceSubmission < DOSSIER_REMINDER_GRACE_DAYS) return null

  const sinceLast = lastSentAt ? -(daysUntil(todayInParis(lastSentAt), today) ?? 0) : null
  // Jamais deux relances le même jour.
  if (sinceLast !== null && sinceLast < 1) return null

  const closingDay = todayInParis(closesAt)
  const daysLeft = daysUntil(closingDay, today) ?? 0
  if (settings.finalDays > 0 && daysLeft <= settings.finalDays) {
    // Déjà relancé depuis l'entrée dans la fenêtre de relance renforcée ?
    const lastDaysLeft = lastSentAt ? (daysUntil(closingDay, todayInParis(lastSentAt)) ?? Infinity) : Infinity
    if (lastDaysLeft <= settings.finalDays) return null
    // Laisse au moins un jour d'écart avec une relance régulière toute récente.
    return sinceLast === null || sinceLast >= 2 ? "final" : null
  }

  const reference = sinceLast ?? sinceSubmission
  return reference >= settings.intervalDays ? "regular" : null
}
