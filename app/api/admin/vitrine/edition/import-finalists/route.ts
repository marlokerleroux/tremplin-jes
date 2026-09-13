import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiAdmin } from "@/lib/auth-helpers"
import { importFinalistsSchema } from "@/lib/validation/vitrine"
import { formatZodError } from "@/lib/validation/common"
import type { FinalistEntry } from "@/lib/vitrine/modes"

/** Propose les finalistes cochés dans l'onglet Résultats pour l'édition demandée (à compléter ensuite). */
export async function POST(request: Request) {
  const authResult = await requireApiAdmin()
  if (!authResult.ok) return authResult.response

  try {
    const parsed = importFinalistsSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }
    const applications = await prisma.application.findMany({
      where: { edition: parsed.data.edition, is_finalist: true, status: "validated" },
      select: { id: true, stage_name: true, musical_style: true, biography: true, instagram: true },
      orderBy: { stage_name: "asc" },
    })
    const finalists: FinalistEntry[] = applications.map((app) => ({
      id: `app-${app.id}`,
      name: app.stage_name,
      genre: app.musical_style,
      description: app.biography.length > 400 ? `${app.biography.slice(0, 397).trimEnd()}…` : app.biography,
      image: "",
      youtubeId: "",
    }))
    return NextResponse.json({ finalists })
  } catch (error) {
    console.error("Error importing finalists:", error)
    return NextResponse.json({ error: "Erreur lors de l'import des finalistes" }, { status: 500 })
  }
}
