import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const applications = await prisma.application.findMany({
      include: {
        profile: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
            street_address: true,
            city: true,
            postal_code: true,
            phone: true,
            role: true,
          },
        },
        technical_sheets: true,
        parental_authorizations: true,
      },
      orderBy: { created_at: "desc" },
    })

    // Filter out admin applications
    const filtered = applications.filter((app) => app.profile.role !== "admin")

    // Transform to match expected shape (profiles key instead of profile)
    const result = filtered.map((app) => ({
      ...app,
      profiles: app.profile,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching applications:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des candidatures" },
      { status: 500 }
    )
  }
}
