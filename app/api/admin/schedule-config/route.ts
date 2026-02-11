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

    const config = await prisma.scheduleConfig.findFirst()

    return NextResponse.json(config)
  } catch (error) {
    console.error("Error fetching schedule config:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la configuration" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const body = await request.json()

    // Find existing config or create one
    const existing = await prisma.scheduleConfig.findFirst()

    let config
    if (existing) {
      config = await prisma.scheduleConfig.update({
        where: { id: existing.id },
        data: {
          venue: body.venue,
          is_validated: body.is_validated,
        },
      })
    } else {
      config = await prisma.scheduleConfig.create({
        data: {
          venue: body.venue,
          is_validated: body.is_validated ?? false,
        },
      })
    }

    return NextResponse.json({ success: true, config })
  } catch (error) {
    console.error("Error updating schedule config:", error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la configuration" },
      { status: 500 }
    )
  }
}
