import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiAdmin } from "@/lib/auth-helpers"
import { getSeasonConfig, serializeSeasonConfig } from "@/lib/season-config"
import { newSeasonSchema } from "@/lib/validation/admin"
import { formatZodError } from "@/lib/validation/common"

/**
 * Ouvre une nouvelle saison : change l'édition, remet le planning en brouillon
 * et efface les dates de la saison précédente. Les candidatures existantes restent
 * rattachées à leur édition (archivées, invisibles dans la vue courante).
 */
export async function POST(request: Request) {
  const authResult = await requireApiAdmin()
  if (!authResult.ok) return authResult.response

  try {
    const parsed = newSeasonSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }
    const { edition } = parsed.data

    const existing = await getSeasonConfig()
    if (edition <= existing.edition) {
      return NextResponse.json(
        { error: `La nouvelle édition doit être postérieure à l'édition en cours (${existing.edition})` },
        { status: 400 },
      )
    }

    const config = await prisma.scheduleConfig.update({
      where: { id: existing.id },
      data: {
        edition,
        is_validated: false,
        registration_opens_at: null,
        registration_closes_at: null,
        audition_dates: [],
        age_reference_date: null,
      },
    })

    return NextResponse.json({ success: true, config: serializeSeasonConfig(config) })
  } catch (error) {
    console.error("Error starting new season:", error)
    return NextResponse.json({ error: "Erreur lors de l'ouverture de la nouvelle saison" }, { status: 500 })
  }
}
