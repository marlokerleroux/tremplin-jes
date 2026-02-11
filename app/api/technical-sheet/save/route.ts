import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const body = await request.json()
    const { application_id, sound_engineer, instruments, microphones, monitoring, notes } = body

    if (!application_id) {
      return NextResponse.json(
        { error: "ID de candidature manquant" },
        { status: 400 }
      )
    }

    // Verify the application belongs to the current user
    const application = await prisma.application.findUnique({
      where: { id: application_id },
    })

    if (!application || application.user_id !== session.user.id) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    // Upsert technical sheet by application_id
    const existingSheet = await prisma.technicalSheet.findFirst({
      where: { application_id },
    })

    let technicalSheet
    if (existingSheet) {
      technicalSheet = await prisma.technicalSheet.update({
        where: { id: existingSheet.id },
        data: {
          sound_engineer: sound_engineer || null,
          instruments: instruments || null,
          microphones: microphones || null,
          monitoring: monitoring || null,
          notes: notes || null,
        },
      })
    } else {
      technicalSheet = await prisma.technicalSheet.create({
        data: {
          application_id,
          sound_engineer: sound_engineer || null,
          instruments: instruments || null,
          microphones: microphones || null,
          monitoring: monitoring || null,
          notes: notes || null,
        },
      })
    }

    return NextResponse.json({ success: true, technicalSheet })
  } catch (error) {
    console.error("Error saving technical sheet:", error)
    return NextResponse.json(
      { error: "Erreur lors de la sauvegarde de la fiche technique" },
      { status: 500 }
    )
  }
}
