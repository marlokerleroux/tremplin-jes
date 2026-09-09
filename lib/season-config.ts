import type { Prisma, ScheduleConfig } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { getAgeReferenceDate, getRegistrationStatus, type RegistrationStatus } from "@/lib/season"

export type SeasonConfig = ScheduleConfig

/** Version sérialisable (dates en ISO) pour les composants client. */
export interface SeasonConfigDTO {
  id: string
  edition: number
  registration_opens_at: string | null
  registration_closes_at: string | null
  audition_dates: string[]
  age_reference_date: string | null
  is_validated: boolean
  venue: string | null
}

export const DEFAULT_VENUE = "Espace Léo Ferré, Brest"

function defaultEdition(now = new Date()): number {
  // La finale a lieu au printemps : une saison lancée à partir de septembre porte l'année suivante.
  return now.getMonth() >= 8 ? now.getFullYear() + 1 : now.getFullYear()
}

/** Configuration de la saison (une seule ligne, créée si absente). */
export async function getSeasonConfig(): Promise<SeasonConfig> {
  const existing = await prisma.scheduleConfig.findFirst({ orderBy: { created_at: "asc" } })
  if (existing) return existing
  return prisma.scheduleConfig.create({
    data: { edition: defaultEdition(), venue: DEFAULT_VENUE, audition_dates: [] },
  })
}

export function serializeSeasonConfig(config: SeasonConfig): SeasonConfigDTO {
  return {
    id: config.id,
    edition: config.edition,
    registration_opens_at: config.registration_opens_at?.toISOString() ?? null,
    registration_closes_at: config.registration_closes_at?.toISOString() ?? null,
    audition_dates: config.audition_dates,
    age_reference_date: config.age_reference_date,
    is_validated: config.is_validated,
    venue: config.venue,
  }
}

export interface SeasonState {
  config: SeasonConfig
  registration: RegistrationStatus
  ageReferenceDate: string
  venue: string
}

export async function getSeasonState(now = new Date()): Promise<SeasonState> {
  const config = await getSeasonConfig()
  return {
    config,
    registration: getRegistrationStatus(config, now),
    ageReferenceDate: getAgeReferenceDate(config),
    venue: config.venue || DEFAULT_VENUE,
  }
}

/** Candidature de l'utilisateur pour l'édition en cours. */
export async function getCurrentApplication<T extends Prisma.ApplicationInclude | undefined = undefined>(
  userId: string,
  edition: number,
  include?: T,
) {
  return prisma.application.findUnique({
    where: { user_id_edition: { user_id: userId, edition } },
    include,
  } as Prisma.ApplicationFindUniqueArgs) as Promise<Prisma.ApplicationGetPayload<{ include: T }> | null>
}
