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

    // Check for existing application
    const existing = await prisma.application.findUnique({
      where: { user_id: session.user.id },
    })
    if (existing) {
      return NextResponse.json(
        { error: "Vous avez déjà soumis une candidature." },
        { status: 400 }
      )
    }

    const application = await prisma.application.create({
      data: {
        user_id: session.user.id,
        application_type: body.application_type,
        stage_name: body.stage_name,
        group_members: body.group_members || null,
        biography: body.biography,
        musical_style: body.musical_style,
        instagram: body.instagram || null,
        how_did_you_hear: body.how_did_you_hear || null,
        has_original_composition: body.has_original_composition || false,
        is_sacem_registered: body.is_sacem_registered || null,
        allows_broadcast: body.allows_broadcast || false,
        has_stage_experience: body.has_stage_experience || false,
        stage_experience_details: body.stage_experience_details || null,
        preferred_audition_date: body.preferred_audition_date || null,
        accepted_rules: body.accepted_rules || false,
        status: "pending",
      },
    })

    return NextResponse.json({ success: true, application })
  } catch (error) {
    console.error("Error creating application:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création de la candidature" },
      { status: 500 }
    )
  }
}
