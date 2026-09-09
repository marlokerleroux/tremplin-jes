import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiUser } from "@/lib/auth-helpers"
import { getSeasonConfig } from "@/lib/season-config"
import { deleteBlobs } from "@/lib/blob-storage"

export async function DELETE() {
  try {
    const authResult = await requireApiUser()
    if (!authResult.ok) return authResult.response
    const { session } = authResult

    const config = await getSeasonConfig()
    const application = await prisma.application.findUnique({
      where: { user_id_edition: { user_id: session.user.id, edition: config.edition } },
      select: {
        id: true,
        status: true,
        time_slot_id: true,
        technical_sheet: { select: { pdf_url: true } },
        parental_authorizations: { select: { pdf_url: true } },
      },
    })

    if (!application) {
      return NextResponse.json({ error: "Aucune candidature trouvée" }, { status: 404 })
    }

    if (application.status === "validated") {
      return NextResponse.json({ error: "Impossible de supprimer une candidature validée" }, { status: 403 })
    }

    // La suppression en cascade gère fiche technique, autorisations parentales et suivi d'audition ;
    // un créneau éventuellement attribué est libéré.
    await prisma.$transaction([
      prisma.application.delete({ where: { id: application.id } }),
      ...(application.time_slot_id
        ? [prisma.timeSlot.update({ where: { id: application.time_slot_id }, data: { is_available: true } })]
        : []),
    ])

    await deleteBlobs([application.technical_sheet?.pdf_url, ...application.parental_authorizations.map((a) => a.pdf_url)])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[api] Unexpected error:", error)
    return NextResponse.json({ error: "Erreur inattendue" }, { status: 500 })
  }
}
