import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiAdmin } from "@/lib/auth-helpers"
import { getSeasonConfig, serializeSeasonConfig } from "@/lib/season-config"
import { seasonConfigSchema } from "@/lib/validation/admin"
import { formatZodError } from "@/lib/validation/common"

export async function GET() {
  const authResult = await requireApiAdmin()
  if (!authResult.ok) return authResult.response

  try {
    const config = await getSeasonConfig()
    return NextResponse.json(serializeSeasonConfig(config))
  } catch (error) {
    console.error("Error fetching season config:", error)
    return NextResponse.json({ error: "Erreur lors de la récupération de la configuration" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const authResult = await requireApiAdmin()
  if (!authResult.ok) return authResult.response

  try {
    const parsed = seasonConfigSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }
    const data = parsed.data

    const existing = await getSeasonConfig()
    if (data.edition !== existing.edition) {
      return NextResponse.json(
        { error: "Pour changer d'édition, utilisez l'action « Ouvrir une nouvelle saison »" },
        { status: 400 },
      )
    }

    const config = await prisma.scheduleConfig.update({
      where: { id: existing.id },
      data: {
        registration_opens_at: data.registration_opens_at,
        registration_closes_at: data.registration_closes_at,
        audition_dates: data.audition_dates,
        age_reference_date: data.age_reference_date,
        venue: data.venue,
      },
    })

    return NextResponse.json({ success: true, config: serializeSeasonConfig(config) })
  } catch (error) {
    console.error("Error updating season config:", error)
    return NextResponse.json({ error: "Erreur lors de la mise à jour de la configuration" }, { status: 500 })
  }
}
