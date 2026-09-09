import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiAdmin } from "@/lib/auth-helpers"
import { applicationUpdateSchema } from "@/lib/validation/application"
import { formatZodError } from "@/lib/validation/common"

export async function PUT(request: Request) {
  const authResult = await requireApiAdmin()
  if (!authResult.ok) return authResult.response

  try {
    const parsed = applicationUpdateSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }
    const { applicationId, updates } = parsed.data

    const existing = await prisma.application.findUnique({ where: { id: applicationId }, select: { id: true } })
    if (!existing) {
      return NextResponse.json({ error: "Candidature introuvable" }, { status: 404 })
    }

    await prisma.application.update({
      where: { id: applicationId },
      data: {
        stage_name: updates.stage_name,
        musical_style: updates.musical_style,
        biography: updates.biography,
        instagram: updates.instagram,
        has_original_composition: updates.has_original_composition,
        is_sacem_registered: updates.has_original_composition ? updates.is_sacem_registered : null,
        has_stage_experience: updates.has_stage_experience,
        stage_experience_details: updates.has_stage_experience ? updates.stage_experience_details : null,
        group_members: updates.group_members,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in update application:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
