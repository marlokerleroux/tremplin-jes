import { prisma } from "@/lib/prisma"
import { normalizeGroupMembers, type AdminApplicationDTO, toAdminApplicationDTO } from "@/lib/admin-data"
import type { Prisma } from "@prisma/client"

const printInclude = {
  profile: {
    select: { first_name: true, last_name: true, email: true, street_address: true, city: true, postal_code: true, phone: true, role: true },
  },
  technical_sheet: { select: { id: true, pdf_url: true } },
  parental_authorizations: { select: { id: true, member_index: true, member_name: true, pdf_url: true } },
  time_slot: true,
  audition_tracking: true,
} satisfies Prisma.ApplicationInclude

export interface CandidateSheetsFilter {
  edition: number
  id?: string
  date?: string
  status?: "validated"
}

/** Candidatures à imprimer, triées par créneau (date, heure) puis nom de scène. */
export async function listApplicationsForPrint(filter: CandidateSheetsFilter): Promise<AdminApplicationDTO[]> {
  const where: Prisma.ApplicationWhereInput = { edition: filter.edition, profile: { role: { not: "admin" } } }
  if (filter.id) where.id = filter.id
  if (filter.date) where.time_slot = { date: filter.date }
  if (filter.status) where.status = filter.status
  if (!filter.id) where.status = filter.status ?? { not: "rejected" }

  const applications = await prisma.application.findMany({ where, include: printInclude })
  return applications.map(toAdminApplicationDTO).sort((a, b) => {
    const slotA = a.time_slot ? `${a.time_slot.date} ${a.time_slot.start_time}` : "~"
    const slotB = b.time_slot ? `${b.time_slot.date} ${b.time_slot.start_time}` : "~"
    return slotA.localeCompare(slotB) || a.stage_name.localeCompare(b.stage_name, "fr")
  })
}

export function memberCount(application: AdminApplicationDTO): number {
  return application.application_type === "solo" ? 1 : normalizeGroupMembers(application.group_members).length
}
