import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import type { GroupMember } from "@/lib/validation/application"

export interface ProfileDTO {
  first_name: string
  last_name: string
  email: string
  street_address: string | null
  city: string | null
  postal_code: string | null
  phone: string | null
}

export interface TimeSlotDTO {
  id: string
  edition: number
  date: string
  start_time: string
  end_time: string
  is_available: boolean
}

export interface AuditionTrackingDTO {
  id: string
  application_id: string
  has_arrived: boolean
  arrived_at: string | null
  is_checked_in: boolean
  checked_in_at: string | null
  has_performed: boolean
  performed_at: string | null
  notes: string | null
}

export interface AdminApplicationDTO {
  id: string
  user_id: string
  edition: number
  application_type: string
  stage_name: string
  group_members: GroupMember[]
  biography: string
  musical_style: string
  instagram: string | null
  how_did_you_hear: string | null
  has_original_composition: boolean
  is_sacem_registered: boolean | null
  allows_broadcast: boolean
  has_stage_experience: boolean
  stage_experience_details: string | null
  preferred_audition_date: string | null
  accepted_rules: boolean
  status: string
  time_slot_id: string | null
  is_finalist: boolean
  result_sent_at: string | null
  reminder_j7_sent_at: string | null
  reminder_j1_sent_at: string | null
  created_at: string
  profile: ProfileDTO | null
  technical_sheet: { id: string; pdf_url: string | null } | null
  parental_authorizations: Array<{ id: string; member_index: number; member_name: string | null; pdf_url: string }>
  time_slot: TimeSlotDTO | null
  audition_tracking: AuditionTrackingDTO | null
}

const adminInclude = {
  profile: {
    select: {
      first_name: true,
      last_name: true,
      email: true,
      street_address: true,
      city: true,
      postal_code: true,
      phone: true,
      role: true,
    },
  },
  technical_sheet: { select: { id: true, pdf_url: true } },
  parental_authorizations: { select: { id: true, member_index: true, member_name: true, pdf_url: true } },
  time_slot: true,
  audition_tracking: true,
} satisfies Prisma.ApplicationInclude

type ApplicationWithRelations = Prisma.ApplicationGetPayload<{ include: typeof adminInclude }>

/** Normalise le JSON `group_members` (données historiques potentiellement incomplètes). */
export function normalizeGroupMembers(value: unknown): GroupMember[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((m): m is Record<string, unknown> => typeof m === "object" && m !== null)
    .map((m) => ({
      firstName: typeof m.firstName === "string" ? m.firstName : "",
      lastName: typeof m.lastName === "string" ? m.lastName : "",
      birthDate: typeof m.birthDate === "string" ? m.birthDate : "",
    }))
}

export function toAdminApplicationDTO(app: ApplicationWithRelations): AdminApplicationDTO {
  const { profile, technical_sheet, parental_authorizations, time_slot, audition_tracking, ...rest } = app
  return {
    ...rest,
    group_members: normalizeGroupMembers(app.group_members),
    created_at: app.created_at.toISOString(),
    result_sent_at: app.result_sent_at?.toISOString() ?? null,
    reminder_j7_sent_at: app.reminder_j7_sent_at?.toISOString() ?? null,
    reminder_j1_sent_at: app.reminder_j1_sent_at?.toISOString() ?? null,
    profile: profile
      ? {
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: profile.email,
          street_address: profile.street_address,
          city: profile.city,
          postal_code: profile.postal_code,
          phone: profile.phone,
        }
      : null,
    technical_sheet: technical_sheet ?? null,
    parental_authorizations,
    time_slot: time_slot ?? null,
    audition_tracking: audition_tracking
      ? {
          id: audition_tracking.id,
          application_id: audition_tracking.application_id,
          has_arrived: audition_tracking.has_arrived,
          arrived_at: audition_tracking.arrived_at?.toISOString() ?? null,
          is_checked_in: audition_tracking.is_checked_in,
          checked_in_at: audition_tracking.checked_in_at?.toISOString() ?? null,
          has_performed: audition_tracking.has_performed,
          performed_at: audition_tracking.performed_at?.toISOString() ?? null,
          notes: audition_tracking.notes,
        }
      : null,
  }
}

/** Candidatures d'une édition (hors comptes administrateurs), pour l'interface admin. */
export async function listApplicationsForAdmin(edition: number): Promise<AdminApplicationDTO[]> {
  const applications = await prisma.application.findMany({
    where: { edition, profile: { role: { not: "admin" } } },
    include: adminInclude,
    orderBy: { created_at: "desc" },
  })
  return applications.map(toAdminApplicationDTO)
}

export async function listTimeSlots(edition: number): Promise<TimeSlotDTO[]> {
  return prisma.timeSlot.findMany({
    where: { edition },
    orderBy: [{ date: "asc" }, { start_time: "asc" }],
  })
}

export interface EditionSummary {
  edition: number
  applications: number
  validated: number
  time_slots: number
  is_current: boolean
}

export async function listEditions(currentEdition: number): Promise<EditionSummary[]> {
  const [apps, validated, slots] = await Promise.all([
    prisma.application.groupBy({ by: ["edition"], _count: { _all: true } }),
    prisma.application.groupBy({ by: ["edition"], where: { status: "validated" }, _count: { _all: true } }),
    prisma.timeSlot.groupBy({ by: ["edition"], _count: { _all: true } }),
  ])
  const editions = new Set<number>([currentEdition, ...apps.map((a) => a.edition), ...slots.map((s) => s.edition)])
  return Array.from(editions)
    .sort((a, b) => b - a)
    .map((edition) => ({
      edition,
      applications: apps.find((a) => a.edition === edition)?._count._all ?? 0,
      validated: validated.find((a) => a.edition === edition)?._count._all ?? 0,
      time_slots: slots.find((s) => s.edition === edition)?._count._all ?? 0,
      is_current: edition === currentEdition,
    }))
}
