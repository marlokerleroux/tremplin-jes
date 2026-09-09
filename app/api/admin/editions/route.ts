import { NextResponse } from "next/server"
import { requireApiAdmin } from "@/lib/auth-helpers"
import { listEditions } from "@/lib/admin-data"
import { getSeasonConfig } from "@/lib/season-config"
import { prisma } from "@/lib/prisma"

/** Liste des éditions présentes en base avec leurs volumes (archives). */
export async function GET() {
  const authResult = await requireApiAdmin()
  if (!authResult.ok) return authResult.response

  try {
    const config = await getSeasonConfig()
    const [editions, orphanAccounts] = await Promise.all([
      listEditions(config.edition),
      prisma.profile.count({ where: { role: "user", applications: { none: {} } } }),
    ])
    return NextResponse.json({ current: config.edition, editions, orphanAccounts })
  } catch (error) {
    console.error("Error listing editions:", error)
    return NextResponse.json({ error: "Erreur lors de la récupération des éditions" }, { status: 500 })
  }
}
