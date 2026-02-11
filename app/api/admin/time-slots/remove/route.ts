import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const { applicationId } = await request.json()

    if (!applicationId) {
      return NextResponse.json(
        { error: "ID de candidature manquant" },
        { status: 400 }
      )
    }

    // Get the application to find the current time slot
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    })

    if (!application) {
      return NextResponse.json(
        { error: "Candidature introuvable" },
        { status: 404 }
      )
    }

    if (!application.time_slot_id) {
      return NextResponse.json(
        { error: "Aucun créneau attribué à cette candidature" },
        { status: 400 }
      )
    }

    // Set the time slot back to available
    await prisma.timeSlot.update({
      where: { id: application.time_slot_id },
      data: { is_available: true },
    })

    // Clear the time slot from the application
    await prisma.application.update({
      where: { id: applicationId },
      data: { time_slot_id: null },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing time slot:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression du créneau" },
      { status: 500 }
    )
  }
}
