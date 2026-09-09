import { NextResponse } from "next/server"
import { requireApiAdmin } from "@/lib/auth-helpers"
import { listApplicationsForAdmin } from "@/lib/admin-data"
import { getSeasonConfig } from "@/lib/season-config"

/** Liste des candidatures d'une édition (par défaut : édition en cours). */
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
    const applications = await listApplicationsForAdmin(edition)
    return NextResponse.json(applications)
  } catch (error) {
    console.error("Error fetching applications:", error)
    return NextResponse.json({ error: "Erreur lors de la récupération des candidatures" }, { status: 500 })
  }
}
