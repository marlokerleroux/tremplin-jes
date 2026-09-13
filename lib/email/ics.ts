import { isHHMM, parseIsoDate } from "@/lib/season"

/**
 * Invitation calendrier (iCalendar) pour une audition. Module pur : testé avec Vitest.
 * Les heures sont saisies en heure de Paris et converties en UTC pour être comprises par tous les agendas.
 */

const PARIS = "Europe/Paris"

/** Décalage (minutes) de l'heure de Paris par rapport à UTC à un instant donné. */
export function parisOffsetMinutes(at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: PARIS, timeZoneName: "longOffset" }).formatToParts(at)
  const label = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT"
  const match = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(label)
  if (!match) return 0
  const sign = match[1] === "-" ? -1 : 1
  return sign * (Number(match[2]) * 60 + Number(match[3] ?? 0))
}

/** Instant UTC correspondant à une date "YYYY-MM-DD" et une heure "HH:MM" à Paris. */
export function parisToUtc(isoDate: string, hhmm: string): Date | null {
  const day = parseIsoDate(isoDate)
  if (!day || !isHHMM(hhmm)) return null
  const [hours, minutes] = hhmm.split(":").map(Number)
  const naive = Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), hours, minutes)
  // Premier passage avec le décalage estimé, second passage pour corriger autour d'un changement d'heure.
  const first = new Date(naive - parisOffsetMinutes(new Date(naive)) * 60_000)
  return new Date(naive - parisOffsetMinutes(first) * 60_000)
}

function icsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")
}

function icsText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n")
}

/** Plie les lignes à 75 octets comme l'exige la RFC 5545. */
function fold(line: string): string {
  const bytes = Buffer.from(line, "utf8")
  if (bytes.length <= 75) return line
  const chunks: string[] = []
  let current = ""
  for (const char of line) {
    if (Buffer.byteLength(current + char, "utf8") > (chunks.length === 0 ? 75 : 74)) {
      chunks.push(current)
      current = char
    } else {
      current += char
    }
  }
  chunks.push(current)
  return chunks.join("\r\n ")
}

export interface AuditionEventInput {
  uid: string
  date: string
  startTime: string
  endTime: string
  summary: string
  description: string
  location: string
  /** Instant de génération (pour DTSTAMP), par défaut maintenant. */
  now?: Date
}

/** Contenu d'un fichier .ics pour une audition, ou null si les données sont invalides. */
export function buildAuditionIcs(input: AuditionEventInput): string | null {
  const start = parisToUtc(input.date, input.startTime)
  const end = parisToUtc(input.date, input.endTime)
  if (!start || !end) return null
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Tremplin Jeunes en Scene//Candidat//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${icsText(input.uid)}`,
    `DTSTAMP:${icsDate(input.now ?? new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end <= start ? new Date(start.getTime() + 30 * 60_000) : end)}`,
    `SUMMARY:${icsText(input.summary)}`,
    `DESCRIPTION:${icsText(input.description)}`,
    `LOCATION:${icsText(input.location)}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${icsText(input.summary)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
  return lines.map(fold).join("\r\n") + "\r\n"
}
