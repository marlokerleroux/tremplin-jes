import { parseIsoDate } from "@/lib/season"

/**
 * Règles des rappels automatiques avant audition (J-7 et J-1). Module pur, testé avec Vitest.
 * La tâche planifiée tourne une fois par jour à une heure imprécise : les fenêtres tolèrent un jour manqué.
 */

export type ReminderKind = "j7" | "j1"

/** Date du jour "YYYY-MM-DD" en heure de Paris. */
export function todayInParis(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ""
  return `${get("year")}-${get("month")}-${get("day")}`
}

/** Nombre de jours entre aujourd'hui et la date d'audition (négatif si passée). */
export function daysUntil(auditionDate: string, today: string): number | null {
  const target = parseIsoDate(auditionDate)
  const from = parseIsoDate(today)
  if (!target || !from) return null
  return Math.round((target.getTime() - from.getTime()) / 86_400_000)
}

export interface ReminderState {
  reminder_j7_sent_at: Date | string | null
  reminder_j1_sent_at: Date | string | null
}

/**
 * Rappels à envoyer aujourd'hui pour une audition donnée :
 * - J-7 entre 5 et 7 jours avant (si pas encore envoyé) ;
 * - J-1 la veille uniquement (un rappel « c'est demain » envoyé le jour même serait faux).
 */
export function dueReminders(auditionDate: string, today: string, state: ReminderState): ReminderKind[] {
  const days = daysUntil(auditionDate, today)
  if (days === null) return []
  const due: ReminderKind[] = []
  if (!state.reminder_j7_sent_at && days >= 5 && days <= 7) due.push("j7")
  if (!state.reminder_j1_sent_at && days === 1) due.push("j1")
  return due
}
