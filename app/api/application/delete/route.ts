import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Get user's application
    const application = await prisma.application.findUnique({
      where: { user_id: session.user.id },
      select: { id: true, status: true },
    })

    if (!application) {
      return NextResponse.json({ error: "Aucune candidature trouvée" }, { status: 404 })
    }

    // Check if application is validated
    if (application.status === "validated") {
      return NextResponse.json({ error: "Impossible de supprimer une candidature validée" }, { status: 403 })
    }

    // Delete application (cascade will handle related records: technical_sheets, parental_authorizations, audition_tracking)
    await prisma.application.delete({
      where: { id: application.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
    return NextResponse.json({ error: "Erreur inattendue" }, { status: 500 })
  }
}
