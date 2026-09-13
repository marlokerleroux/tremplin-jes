import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiAdmin } from "@/lib/auth-helpers"
import { getSeasonConfig, serializeSeasonConfig } from "@/lib/season-config"
import { getVitrineConfig, getVitrineEdition, listPartners, listVitrineEditions } from "@/lib/vitrine/site"
import { vitrineConfigSchema } from "@/lib/validation/vitrine"
import { formatZodError } from "@/lib/validation/common"

/** État complet du site vitrine pour l'administration. */
export async function GET(request: Request) {
  const authResult = await requireApiAdmin()
  if (!authResult.ok) return authResult.response

  try {
    const seasonConfig = await getSeasonConfig()
    const config = await getVitrineConfig()
    const raw = new URL(request.url).searchParams.get("edition")
    const requested = raw ? Number.parseInt(raw, 10) : (config.edition ?? seasonConfig.edition)
    const editionNumber = Number.isInteger(requested) ? requested : seasonConfig.edition
    const [edition, editions, partners] = await Promise.all([getVitrineEdition(editionNumber), listVitrineEditions(), listPartners(false)])
    return NextResponse.json({
      config,
      season: serializeSeasonConfig(seasonConfig),
      edition,
      editions: editions.map((e) => ({ edition: e.edition, jury_winner: e.jury_winner, public_winner: e.public_winner, finalists: e.finalists.length })),
      partners,
    })
  } catch (error) {
    console.error("Error loading vitrine settings:", error)
    return NextResponse.json({ error: "Erreur lors du chargement des réglages du site" }, { status: 500 })
  }
}

/** Mode d'affichage, bandeau et textes d'introduction. */
export async function PUT(request: Request) {
  const authResult = await requireApiAdmin()
  if (!authResult.ok) return authResult.response

  try {
    const parsed = vitrineConfigSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }
    const existing = await prisma.vitrineConfig.findFirst({ orderBy: { updated_at: "asc" } })
    const data = parsed.data
    if (existing) {
      await prisma.vitrineConfig.update({ where: { id: existing.id }, data })
    } else {
      await prisma.vitrineConfig.create({ data })
    }
    return NextResponse.json({ success: true, config: await getVitrineConfig() })
  } catch (error) {
    console.error("Error saving vitrine config:", error)
    return NextResponse.json({ error: "Erreur lors de l'enregistrement" }, { status: 500 })
  }
}
