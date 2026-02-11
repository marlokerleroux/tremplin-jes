import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const existing = await prisma.scheduleConfig.findFirst()

    if (!existing) {
      return NextResponse.json(
        { error: "Configuration du planning introuvable" },
        { status: 404 }
      )
    }

    const config = await prisma.scheduleConfig.update({
      where: { id: existing.id },
      data: { is_validated: true },
    })

    return NextResponse.json({ success: true, config })
  } catch (error) {
    console.error("Error validating schedule:", error)
    return NextResponse.json(
      { error: "Erreur lors de la validation du planning" },
      { status: 500 }
    )
  }
}
