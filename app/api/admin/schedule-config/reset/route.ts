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

    // Set is_validated to false
    await prisma.scheduleConfig.update({
      where: { id: existing.id },
      data: { is_validated: false },
    })

    // Unassign all time slots from applications
    await prisma.application.updateMany({
      where: { time_slot_id: { not: null } },
      data: { time_slot_id: null },
    })

    // Set all time slots to available
    await prisma.timeSlot.updateMany({
      where: { is_available: false },
      data: { is_available: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error resetting schedule:", error)
    return NextResponse.json(
      { error: "Erreur lors de la réinitialisation du planning" },
      { status: 500 }
    )
  }
}
