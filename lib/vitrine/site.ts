import { cache } from "react"
import { prisma } from "@/lib/prisma"
import { getSeasonConfig, serializeSeasonConfig, type SeasonConfigDTO } from "@/lib/season-config"
import { normalizeFinalists, normalizeTourDates, type FinalistEntry, type TourDate, type VitrineMode, isVitrineMode } from "./modes"

/**
 * Données du site vitrine (serveur). Lues à chaque visite : un enregistrement dans
 * l'administration est publié immédiatement (le cache de données de Next servirait une
 * version périmée à la première visite suivant une invalidation).
 */

export const CANDIDATE_SITE_URL = "https://candidat.tremplin-jeunes-en-scene.fr"
export const VITRINE_SITE_URL = "https://www.tremplin-jeunes-en-scene.fr"

export interface VitrineConfigDTO {
  mode: VitrineMode
  banner_enabled: boolean
  banner_text: string
  banner_url: string
  auditions_intro: string
  preseason_text: string
}

export interface VitrineEditionDTO {
  edition: number
  anniversary_label: string
  final_date: string | null // ISO
  final_venue: string
  final_address: string
  final_city: string
  ticket_url: string
  pass_culture_url: string
  price_label: string
  jury_prize_text: string
  public_prize_text: string
  jury_winner: string
  public_winner: string
  aftermath_text: string
  aftermath_video_url: string
  aftermath_photos_url: string
  finalists: FinalistEntry[]
  tour_dates: TourDate[]
}

export interface PartnerDTO {
  id: string
  name: string
  logo_url: string
  url: string
  position: number
  is_active: boolean
}

export interface VitrineData {
  config: VitrineConfigDTO
  season: SeasonConfigDTO
  /** Édition mise en avant (édition de la saison en cours). */
  edition: VitrineEditionDTO
  /** Éditions passées avec un palmarès, de la plus récente à la plus ancienne. */
  palmares: VitrineEditionDTO[]
  partners: PartnerDTO[]
}

export const DEFAULT_PRESEASON_TEXT =
  "Le Tremplin Jeunes en Scène revient pour une nouvelle édition. Musiciennes et musiciens de 13 à 23 ans, préparez vos morceaux : les inscriptions ouvrent bientôt !"

export const DEFAULT_AUDITIONS_INTRO =
  "Le Tremplin Jeunes en Scène est gratuit et ouvert à tous les styles. Solo ou en groupe, vous passez en live devant un jury de professionnels lors des auditions à Brest. Six formations sont ensuite sélectionnées pour la finale."

const DEFAULT_JURY_PRIZE =
  "Le lauréat remporte une tournée dans les festivals bretons partenaires de l'association Pass'Musique, ainsi que l'enregistrement d'un EP dans un studio partenaire."
const DEFAULT_PUBLIC_PRIZE =
  "Le public vote pour son artiste préféré ! Le gagnant remporte une séance photo professionnelle et l'enregistrement d'une maquette."

type EditionRow = NonNullable<Awaited<ReturnType<typeof prisma.vitrineEdition.findUnique>>>

function toEditionDTO(row: EditionRow): VitrineEditionDTO {
  return {
    edition: row.edition,
    anniversary_label: row.anniversary_label ?? "",
    final_date: row.final_date?.toISOString() ?? null,
    final_venue: row.final_venue ?? "",
    final_address: row.final_address ?? "",
    final_city: row.final_city ?? "",
    ticket_url: row.ticket_url ?? "",
    pass_culture_url: row.pass_culture_url ?? "",
    price_label: row.price_label ?? "",
    jury_prize_text: row.jury_prize_text ?? "",
    public_prize_text: row.public_prize_text ?? "",
    jury_winner: row.jury_winner ?? "",
    public_winner: row.public_winner ?? "",
    aftermath_text: row.aftermath_text ?? "",
    aftermath_video_url: row.aftermath_video_url ?? "",
    aftermath_photos_url: row.aftermath_photos_url ?? "",
    finalists: normalizeFinalists(row.finalists),
    tour_dates: normalizeTourDates(row.tour_dates),
  }
}

const DEFAULT_CONFIG: VitrineConfigDTO = { mode: "finale", banner_enabled: false, banner_text: "", banner_url: "", auditions_intro: "", preseason_text: "" }

/** Configuration du site (valeurs par défaut si la ligne n'existe pas encore ; créée à l'enregistrement). */
export async function getVitrineConfig(): Promise<VitrineConfigDTO> {
  const row = await prisma.vitrineConfig.findFirst({ orderBy: { updated_at: "asc" } })
  if (!row) return DEFAULT_CONFIG
  return {
    mode: isVitrineMode(row.mode) ? row.mode : "finale",
    banner_enabled: row.banner_enabled,
    banner_text: row.banner_text ?? "",
    banner_url: row.banner_url ?? "",
    auditions_intro: row.auditions_intro ?? "",
    preseason_text: row.preseason_text ?? "",
  }
}

/** Édition du site vitrine, créée avec les textes des prix par défaut si absente (upsert : sûr en cas d'appels concurrents). */
export async function getVitrineEdition(edition: number): Promise<VitrineEditionDTO> {
  const row = await prisma.vitrineEdition.upsert({
    where: { edition },
    create: { edition, jury_prize_text: DEFAULT_JURY_PRIZE, public_prize_text: DEFAULT_PUBLIC_PRIZE, finalists: [], tour_dates: [] },
    update: {},
  })
  return toEditionDTO(row)
}

export async function listVitrineEditions(): Promise<VitrineEditionDTO[]> {
  const rows = await prisma.vitrineEdition.findMany({ orderBy: { edition: "desc" } })
  return rows.map(toEditionDTO)
}

export async function listPartners(onlyActive: boolean): Promise<PartnerDTO[]> {
  const rows = await prisma.vitrinePartner.findMany({
    where: onlyActive ? { is_active: true } : undefined,
    orderBy: [{ position: "asc" }, { name: "asc" }],
  })
  return rows.map((p) => ({ id: p.id, name: p.name, logo_url: p.logo_url, url: p.url ?? "", position: p.position, is_active: p.is_active }))
}

async function loadVitrineData(): Promise<VitrineData> {
  const [config, seasonConfig, partners] = await Promise.all([getVitrineConfig(), getSeasonConfig(), listPartners(true)])
  const [edition, editions] = await Promise.all([getVitrineEdition(seasonConfig.edition), listVitrineEditions()])
  const palmares = editions.filter((e) => e.edition < seasonConfig.edition && (e.jury_winner || e.public_winner || e.finalists.length > 0))
  return { config, season: serializeSeasonConfig(seasonConfig), edition, palmares, partners }
}

// Une seule lecture par requête, partagée entre le layout et la page.
const loadVitrineDataOnce = cache(loadVitrineData)

/** Données du site, avec un mode forcé pour l'aperçu privé. */
export async function getVitrineData(options?: { modeOverride?: VitrineMode }): Promise<VitrineData> {
  const data = await loadVitrineDataOnce()
  return options?.modeOverride ? { ...data, config: { ...data.config, mode: options.modeOverride } } : data
}
