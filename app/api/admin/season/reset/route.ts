import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiAdmin } from "@/lib/auth-helpers"
import { getSeasonConfig, serializeSeasonConfig } from "@/lib/season-config"

/** Repasse le planning en brouillon (les créneaux déjà attribués sont conservés). */
export async function POST() {
  const authResult = await requireApiAdmin()
  if (!authResult.ok) return authResult.response

  try {
    const existing = await getSeasonConfig()
    const config = await prisma.scheduleConfig.update({
      where: { id: existing.id },
      data: { is_validated: false },
    })
    return NextResponse.json({ success: true, config: serializeSeasonConfig(config) })
  } catch (error) {
    console.error("Error resetting schedule:", error)
    return NextResponse.json({ error: "Erreur lors de la réinitialisation du planning" }, { status: 500 })
  }
}
