import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function PUT(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const { applicationId, status } = await request.json()

    if (!applicationId || !status) {
      return NextResponse.json(
        { error: "ID de candidature et statut requis" },
        { status: 400 }
      )
    }

    const validStatuses = ["pending", "validated", "rejected"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Statut invalide" },
        { status: 400 }
      )
    }

    const application = await prisma.application.update({
      where: { id: applicationId },
      data: { status },
    })

    return NextResponse.json({ success: true, application })
  } catch (error) {
    console.error("Error updating application status:", error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du statut" },
      { status: 500 }
    )
  }
}
