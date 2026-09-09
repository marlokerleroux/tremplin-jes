import type { AdminApplicationDTO } from "@/lib/admin-data"
import { computeAgeAt, isMinorAt } from "@/lib/season"

/** Appel API JSON côté client : lève une erreur avec le message renvoyé par le serveur. */
export async function apiJson<T = unknown>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: { ...(init?.body && typeof init.body === "string" ? { "Content-Type": "application/json" } : {}), ...init?.headers },
  })
  const data = (await response.json().catch(() => ({}))) as T & { error?: string; message?: string }
  if (!response.ok) {
    throw new Error(data?.error || data?.message || `Erreur ${response.status}`)
  }
  return data
}

export interface MinorMember {
  index: number
  firstName: string
  lastName: string
  birthDate: string
  age: number | null
}

export function getMinorMembers(application: AdminApplicationDTO, ageReferenceDate: string): MinorMember[] {
  return application.group_members
    .map((member, index) => ({
      index,
      firstName: member.firstName,
      lastName: member.lastName,
      birthDate: member.birthDate,
      age: computeAgeAt(member.birthDate, ageReferenceDate),
    }))
    .filter((member) => member.birthDate && isMinorAt(member.birthDate, ageReferenceDate))
}

export function memberLabel(application: AdminApplicationDTO, member: MinorMember): string {
  if (application.application_type === "solo") return application.stage_name
  return `${member.firstName} ${member.lastName}`.trim() || `Membre ${member.index + 1}`
}

export function hasTechnicalSheet(application: AdminApplicationDTO): boolean {
  return Boolean(application.technical_sheet?.pdf_url)
}

export function getMissingParentalAuths(application: AdminApplicationDTO, ageReferenceDate: string): MinorMember[] {
  const minors = getMinorMembers(application, ageReferenceDate)
  return minors.filter((minor) => !application.parental_authorizations.some((auth) => auth.member_index === minor.index))
}

export function getMissingDocuments(application: AdminApplicationDTO, ageReferenceDate: string): string[] {
  const missing: string[] = []
  if (!hasTechnicalSheet(application)) missing.push("Fiche technique")
  for (const minor of getMissingParentalAuths(application, ageReferenceDate)) {
    missing.push(`Autorisation parentale pour ${memberLabel(application, minor)}`)
  }
  return missing
}

export function formatTime(time: string): string {
  return time.slice(0, 5)
}
