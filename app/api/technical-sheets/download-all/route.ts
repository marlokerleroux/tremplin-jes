import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiAdmin } from "@/lib/auth-helpers"
import { getSeasonConfig } from "@/lib/season-config"
import { technicalSheetUrl } from "@/lib/documents"

/** Liste des fiches techniques disponibles (URLs authentifiées) pour l'export ZIP. */
export async function GET(request: Request) {
  const authResult = await requireApiAdmin()
  if (!authResult.ok) return authResult.response

  try {
    const config = await getSeasonConfig()
    const raw = new URL(request.url).searchParams.get("edition")
    const edition = raw ? Number.parseInt(raw, 10) : config.edition
    if (!Number.isInteger(edition)) {
      return NextResponse.json({ error: "Édition invalide" }, { status: 400 })
    }

    const technicalSheets = await prisma.technicalSheet.findMany({
      where: { pdf_url: { not: null }, application: { edition } },
      select: { application: { select: { id: true, stage_name: true } } },
      orderBy: { application: { stage_name: "asc" } },
    })

    const sheetsData = technicalSheets.map((sheet) => ({
      stageName: sheet.application.stage_name,
      applicationId: sheet.application.id,
      url: technicalSheetUrl(sheet.application.id),
    }))

    return NextResponse.json(sheetsData)
  } catch (error) {
    console.error("[api] Error fetching technical sheets:", error)
    return NextResponse.json({ error: "Erreur lors de la récupération des fiches techniques" }, { status: 500 })
  }
}
