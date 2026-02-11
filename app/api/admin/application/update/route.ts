import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(request: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const body = await request.json()
    const { applicationId, updates } = body

    if (!applicationId) {
      return NextResponse.json({ error: "ID de candidature manquant" }, { status: 400 })
    }

    // Update the application
    const data = await prisma.application.update({
      where: { id: applicationId },
      data: {
        stage_name: updates.stage_name,
        musical_style: updates.musical_style,
        biography: updates.biography,
        instagram: updates.instagram,
        has_original_composition: updates.has_original_composition,
        is_sacem_registered: updates.is_sacem_registered,
        has_stage_experience: updates.has_stage_experience,
        stage_experience_details: updates.stage_experience_details,
        group_members: updates.group_members,
      },
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in update application:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
