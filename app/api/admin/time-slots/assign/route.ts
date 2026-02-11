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

    const { applicationId, timeSlotId } = await request.json()

    if (!applicationId || !timeSlotId) {
      return NextResponse.json(
        { error: "ID de candidature et ID de créneau requis" },
        { status: 400 }
      )
    }

    // Get the application to check if it already has a time slot
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    })

    if (!application) {
      return NextResponse.json(
        { error: "Candidature introuvable" },
        { status: 404 }
      )
    }

    // If the application already has a time slot, set the old one back to available
    if (application.time_slot_id) {
      await prisma.timeSlot.update({
        where: { id: application.time_slot_id },
        data: { is_available: true },
      })
    }

    // Update the application with the new time slot
    await prisma.application.update({
      where: { id: applicationId },
      data: { time_slot_id: timeSlotId },
    })

    // Set the new time slot to unavailable
    await prisma.timeSlot.update({
      where: { id: timeSlotId },
      data: { is_available: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error assigning time slot:", error)
    return NextResponse.json(
      { error: "Erreur lors de l'attribution du créneau" },
      { status: 500 }
    )
  }
}
