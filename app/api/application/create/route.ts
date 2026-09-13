import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requireApiUser } from "@/lib/auth-helpers"
import { applicationCreateSchema } from "@/lib/validation/application"
import { formatZodError } from "@/lib/validation/common"
import { getSeasonState } from "@/lib/season-config"
import { validateEligibility } from "@/lib/season"
import { notifyAdmins, sendApplicationSubmittedEmail } from "@/lib/email/notifications"
import { formatDateFr } from "@/lib/season"

export async function POST(request: Request) {
  try {
    const authResult = await requireApiUser()
    if (!authResult.ok) return authResult.response
    const { session } = authResult

    const parsed = applicationCreateSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }
    const data = parsed.data

    const season = await getSeasonState()
    if (season.registration !== "open") {
      return NextResponse.json({ error: "Les inscriptions ne sont pas ouvertes" }, { status: 403 })
    }

    const profile = await prisma.profile.findUnique({
      where: { id: session.user.id },
      select: { email: true, first_name: true, last_name: true, email_verified_at: true },
    })
    if (!profile) {
      return NextResponse.json({ error: "Compte introuvable" }, { status: 404 })
    }
    if (!profile.email_verified_at) {
      return NextResponse.json({ error: "Confirmez votre adresse email avant de déposer votre candidature" }, { status: 403 })
    }

    const eligibility = validateEligibility(data.application_type, data.group_members, season.ageReferenceDate)
    if (!eligibility.valid) {
      return NextResponse.json({ error: eligibility.errors.join(" ") }, { status: 400 })
    }

    if (data.preferred_audition_date && !season.config.audition_dates.includes(data.preferred_audition_date)) {
      return NextResponse.json({ error: "Date d'audition inconnue" }, { status: 400 })
    }

    let application
    try {
      application = await prisma.application.create({
        data: {
          user_id: session.user.id,
          edition: season.config.edition,
          application_type: data.application_type,
          stage_name: data.stage_name,
          group_members: data.group_members,
          biography: data.biography,
          musical_style: data.musical_style,
          instagram: data.instagram,
          how_did_you_hear: data.how_did_you_hear,
          has_original_composition: data.has_original_composition,
          is_sacem_registered: data.has_original_composition ? data.is_sacem_registered : null,
          allows_broadcast: data.allows_broadcast,
          has_stage_experience: data.has_stage_experience,
          stage_experience_details: data.has_stage_experience ? data.stage_experience_details : null,
          preferred_audition_date: data.preferred_audition_date,
          accepted_rules: true,
          status: "pending",
        },
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return NextResponse.json({ error: "Vous avez déjà soumis une candidature pour cette édition." }, { status: 400 })
      }
      throw error
    }

    await sendApplicationSubmittedEmail(profile.email, profile.first_name, profile.last_name, application.application_type)
    await notifyAdmins(`Nouvelle candidature : ${application.stage_name}`, [
      `${application.application_type === "solo" ? "Artiste solo" : `Groupe (${data.group_members.length} membres)`} · ${application.musical_style} · édition ${application.edition}`,
      `Candidat : ${profile.first_name} ${profile.last_name} · ${profile.email}`,
      application.preferred_audition_date ? `Date d'audition souhaitée : ${formatDateFr(application.preferred_audition_date)}` : "Pas de date d'audition souhaitée",
    ])

    return NextResponse.json({ success: true, applicationId: application.id })
  } catch (error) {
    console.error("Error creating application:", error)
    return NextResponse.json({ error: "Erreur lors de la création de la candidature" }, { status: 500 })
  }
}
