import { prisma } from "@/lib/prisma"
import { getSeasonConfig, DEFAULT_VENUE, type SeasonConfig } from "@/lib/season-config"
import { formatDateFr, formatDateTimeFr, GROUP_MEMBER_MAX_AGE, SOLO_MAX_AGE, SOLO_MIN_AGE } from "@/lib/season"
import { substitute, type TemplateVars } from "@/lib/email/template-engine"
import { DEFAULT_RULES_BODY, DEFAULT_RULES_TITLE, type RulesVariable } from "./default"
import { joinFr, seasonLabel } from "./markup"
import { renderRulesPdf } from "./pdf"

const RULES_ID = "current"

export interface StoredRules {
  title: string
  body: string
  isCustomized: boolean
  updated_at: string | null
}

/** Règlement effectif : version enregistrée en base, sinon texte par défaut. */
export async function getRules(): Promise<StoredRules> {
  const stored = await prisma.rulesDocument.findUnique({ where: { id: RULES_ID } })
  if (!stored) return { title: DEFAULT_RULES_TITLE, body: DEFAULT_RULES_BODY, isCustomized: false, updated_at: null }
  return { title: stored.title, body: stored.body, isCustomized: true, updated_at: stored.updated_at.toISOString() }
}

export async function saveRules(title: string, body: string): Promise<StoredRules> {
  const saved = await prisma.rulesDocument.upsert({
    where: { id: RULES_ID },
    create: { id: RULES_ID, title, body },
    update: { title, body },
  })
  return { title: saved.title, body: saved.body, isCustomized: true, updated_at: saved.updated_at.toISOString() }
}

export async function resetRules(): Promise<StoredRules> {
  await prisma.rulesDocument.deleteMany({ where: { id: RULES_ID } })
  return { title: DEFAULT_RULES_TITLE, body: DEFAULT_RULES_BODY, isCustomized: false, updated_at: null }
}

/** Valeurs des variables du règlement pour la saison configurée (vide si non renseignée). */
export function rulesVars(season: SeasonConfig): Record<RulesVariable, string> {
  const dates = [...season.audition_dates].sort().map((date) => formatDateFr(date))
  return {
    edition: String(season.edition),
    saison: seasonLabel(season.edition),
    annee_precedente: String(season.edition - 1),
    dates_auditions: joinFr(dates),
    lieu: season.venue || DEFAULT_VENUE,
    date_ouverture: season.registration_opens_at ? formatDateTimeFr(season.registration_opens_at) : "",
    date_cloture: season.registration_closes_at ? formatDateTimeFr(season.registration_closes_at) : "",
    age_min: String(SOLO_MIN_AGE),
    age_max: String(SOLO_MAX_AGE),
    age_max_membre: String(GROUP_MEMBER_MAX_AGE),
  }
}

export function rulesFilename(edition: number): string {
  return `reglement-tremplin-jeunes-en-scene-${edition}.pdf`
}

/** Rend le règlement (texte donné, ou version enregistrée) en PDF pour la saison en cours. */
export async function buildRulesPdf(override?: { title: string; body: string }) {
  const [season, rules] = await Promise.all([getSeasonConfig(), override ? null : getRules()])
  const source = override ?? rules!
  const vars: TemplateVars = rulesVars(season)
  const updatedAt = rules?.updated_at ? formatDateFr(rules.updated_at.slice(0, 10), { weekday: false }) : null
  const bytes = await renderRulesPdf({
    title: substitute(source.title, vars),
    body: substitute(source.body, vars),
    footer: `Tremplin Jeunes en Scène ${seasonLabel(season.edition)} — Association Pass'Musique`,
    updatedAt,
  })
  return { bytes, filename: rulesFilename(season.edition) }
}

export function pdfResponse(bytes: Uint8Array, filename: string, cacheControl: string): Response {
  return new Response(new Blob([new Uint8Array(bytes)], { type: "application/pdf" }), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": cacheControl,
      "X-Content-Type-Options": "nosniff",
    },
  })
}
