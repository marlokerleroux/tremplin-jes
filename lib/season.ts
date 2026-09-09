/**
 * Règles de saison et d'éligibilité, partagées entre le client et le serveur.
 * Aucune dépendance : ce module doit rester pur (testé avec Vitest).
 */

export const SOLO_MIN_AGE = 13
export const SOLO_MAX_AGE = 23 // inclus : 23 ans révolus, moins de 24
export const GROUP_MEMBER_MIN_AGE = 13
export const GROUP_MEMBER_MAX_AGE = 25 // inclus
export const GROUP_AVERAGE_MAX_AGE = 23
export const MAJORITY_AGE = 18

export const APPLICATION_TYPES = ["solo", "group"] as const
export type ApplicationType = (typeof APPLICATION_TYPES)[number]

export const APPLICATION_STATUSES = ["pending", "validated", "rejected"] as const
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]

export interface GroupMemberInput {
  firstName: string
  lastName: string
  birthDate: string // YYYY-MM-DD
}

export interface SeasonConfigLike {
  edition: number
  registration_opens_at: Date | string | null
  registration_closes_at: Date | string | null
  audition_dates: string[]
  age_reference_date: string | null
  venue?: string | null
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/

/** Analyse une date "YYYY-MM-DD" sans décalage de fuseau horaire. */
export function parseIsoDate(value: string | null | undefined): Date | null {
  if (!value || !ISO_DATE.test(value)) return null
  const [y, m, d] = value.split("-").map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null
  return date
}

export function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && parseIsoDate(value) !== null
}

export function isHHMM(value: unknown): value is string {
  return typeof value === "string" && HHMM.test(value)
}

/** Âge révolu (entier) à la date de référence. Null si une des dates est invalide. */
export function computeAgeAt(birthDate: string, referenceDate: string): number | null {
  const birth = parseIsoDate(birthDate)
  const ref = parseIsoDate(referenceDate)
  if (!birth || !ref) return null
  let age = ref.getUTCFullYear() - birth.getUTCFullYear()
  const monthDiff = ref.getUTCMonth() - birth.getUTCMonth()
  if (monthDiff < 0 || (monthDiff === 0 && ref.getUTCDate() < birth.getUTCDate())) {
    age--
  }
  return age
}

export function isMinorAt(birthDate: string, referenceDate: string): boolean {
  const age = computeAgeAt(birthDate, referenceDate)
  return age !== null && age < MAJORITY_AGE
}

export interface EligibilityResult {
  valid: boolean
  errors: string[]
}

/** Formate une date ISO en français ("samedi 31 janvier 2026"). */
export function formatDateFr(isoDate: string, options?: { weekday?: boolean }): string {
  const date = parseIsoDate(isoDate)
  if (!date) return isoDate
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: options?.weekday === false ? undefined : "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date)
}

/** Formate une date ISO en "31/01/2026". */
export function formatDateShortFr(isoDate: string): string {
  const date = parseIsoDate(isoDate)
  if (!date) return isoDate
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(date)
}

/** Formate un instant en français, heure de Paris. */
export function formatDateTimeFr(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  }).format(date)
}

/** Vérifie l'éligibilité d'une candidature selon le règlement. */
export function validateEligibility(
  type: ApplicationType,
  members: GroupMemberInput[],
  referenceDate: string,
): EligibilityResult {
  const errors: string[] = []
  const refLabel = formatDateShortFr(referenceDate)

  if (members.length === 0) {
    return { valid: false, errors: ["Aucune date de naissance renseignée."] }
  }

  if (type === "solo") {
    const age = computeAgeAt(members[0].birthDate, referenceDate)
    if (age === null) {
      errors.push("Date de naissance invalide.")
    } else if (age < SOLO_MIN_AGE) {
      errors.push(`Vous aurez ${age} ans au ${refLabel}. L'âge minimum est de ${SOLO_MIN_AGE} ans.`)
    } else if (age > SOLO_MAX_AGE) {
      errors.push(`Vous aurez ${age} ans au ${refLabel}. L'âge maximum est de ${SOLO_MAX_AGE} ans.`)
    }
    return { valid: errors.length === 0, errors }
  }

  const ages: number[] = []
  members.forEach((member, index) => {
    const age = computeAgeAt(member.birthDate, referenceDate)
    const label = member.firstName ? `${member.firstName} ${member.lastName}`.trim() : `Membre ${index + 1}`
    if (age === null) {
      errors.push(`${label} : date de naissance invalide.`)
      return
    }
    ages.push(age)
    if (age < GROUP_MEMBER_MIN_AGE) {
      errors.push(`${label} aura ${age} ans au ${refLabel}. L'âge minimum est de ${GROUP_MEMBER_MIN_AGE} ans.`)
    } else if (age > GROUP_MEMBER_MAX_AGE) {
      errors.push(
        `${label} aura ${age} ans au ${refLabel}. L'âge maximum pour un membre d'un groupe est de ${GROUP_MEMBER_MAX_AGE} ans.`,
      )
    }
  })

  if (ages.length === members.length) {
    const average = ages.reduce((sum, age) => sum + age, 0) / ages.length
    if (average > GROUP_AVERAGE_MAX_AGE) {
      errors.push(
        `La moyenne d'âge du groupe est de ${average.toFixed(1)} ans au ${refLabel}. Elle doit être de ${GROUP_AVERAGE_MAX_AGE} ans maximum.`,
      )
    }
  }

  return { valid: errors.length === 0, errors }
}

export type RegistrationStatus = "open" | "not_yet_open" | "closed"

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null
  const date = typeof value === "string" ? new Date(value) : value
  return Number.isNaN(date.getTime()) ? null : date
}

/** Statut de la fenêtre d'inscription à un instant donné. */
export function getRegistrationStatus(config: SeasonConfigLike, now: Date = new Date()): RegistrationStatus {
  const opens = toDate(config.registration_opens_at)
  const closes = toDate(config.registration_closes_at)
  if (opens && now < opens) return "not_yet_open"
  if (closes && now >= closes) return "closed"
  return "open"
}

/**
 * Date de référence pour l'âge : configurée, sinon dernière date d'audition,
 * sinon le 31 janvier de l'édition (les auditions ont lieu fin janvier).
 */
export function getAgeReferenceDate(config: SeasonConfigLike): string {
  if (config.age_reference_date && isIsoDate(config.age_reference_date)) return config.age_reference_date
  const dates = [...(config.audition_dates ?? [])].filter(isIsoDate).sort()
  if (dates.length > 0) return dates[dates.length - 1]
  return `${config.edition}-01-31`
}

export interface TimeSlotInput {
  date: string
  start_time: string
  end_time: string
}

function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number)
  return h * 60 + m
}

function toHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

/** Génère des créneaux consécutifs entre deux heures pour une date. */
export function generateTimeSlots(params: {
  date: string
  startTime: string
  endTime: string
  durationMinutes: number
}): TimeSlotInput[] {
  const { date, startTime, endTime, durationMinutes } = params
  if (!isIsoDate(date) || !isHHMM(startTime) || !isHHMM(endTime)) return []
  if (!Number.isInteger(durationMinutes) || durationMinutes < 5 || durationMinutes > 240) return []
  const start = minutesOf(startTime)
  const end = minutesOf(endTime)
  if (end <= start) return []
  const slots: TimeSlotInput[] = []
  for (let t = start; t + durationMinutes <= end; t += durationMinutes) {
    slots.push({ date, start_time: toHHMM(t), end_time: toHHMM(t + durationMinutes) })
  }
  return slots
}
