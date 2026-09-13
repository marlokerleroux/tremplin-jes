import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiAdmin } from "@/lib/auth-helpers"
import { assignSlotSchema } from "@/lib/validation/admin"
import { formatZodError } from "@/lib/validation/common"
import { getSeasonConfig, DEFAULT_VENUE } from "@/lib/season-config"
import { sendTimeSlotAssignedEmail } from "@/lib/email/notifications"

export async function POST(request: Request) {
  const authResult = await requireApiAdmin()
  if (!authResult.ok) return authResult.response

  try {
    const parsed = assignSlotSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }
    const { applicationId, timeSlotId } = parsed.data

    const outcome = await prisma.$transaction(async (tx) => {
      const application = await tx.application.findUnique({
        where: { id: applicationId },
        select: {
          id: true,
          edition: true,
          stage_name: true,
          time_slot_id: true,
          profile: { select: { email: true, first_name: true, last_name: true } },
        },
      })
      if (!application) return { error: "Candidature introuvable", status: 404 } as const

      const slot = await tx.timeSlot.findUnique({ where: { id: timeSlotId } })
      if (!slot) return { error: "Créneau introuvable", status: 404 } as const
      if (slot.edition !== application.edition) return { error: "Créneau d'une autre édition", status: 400 } as const
      if (!slot.is_available && slot.id !== application.time_slot_id) {
        return { error: "Ce créneau est déjà attribué", status: 409 } as const
      }

      if (application.time_slot_id && application.time_slot_id !== slot.id) {
        await tx.timeSlot.update({ where: { id: application.time_slot_id }, data: { is_available: true } })
      }
      await tx.application.update({ where: { id: application.id }, data: { time_slot_id: slot.id } })
      await tx.timeSlot.update({ where: { id: slot.id }, data: { is_available: false } })

      return { application, slot } as const
    })

    if ("error" in outcome) {
      return NextResponse.json({ error: outcome.error }, { status: outcome.status })
    }

    // Si le planning est déjà public, le candidat est prévenu immédiatement.
    const config = await getSeasonConfig()
    let emailSent = false
    if (config.is_validated) {
      const result = await sendTimeSlotAssignedEmail({
        applicationId: outcome.application.id,
        email: outcome.application.profile.email,
        firstName: outcome.application.profile.first_name,
        lastName: outcome.application.profile.last_name,
        stageName: outcome.application.stage_name,
        edition: outcome.application.edition,
        date: outcome.slot.date,
        startTime: outcome.slot.start_time,
        endTime: outcome.slot.end_time,
        venue: config.venue || DEFAULT_VENUE,
      })
      emailSent = result.success
    }

    return NextResponse.json({ success: true, emailSent })
  } catch (error) {
    console.error("Error assigning time slot:", error)
    return NextResponse.json({ error: "Erreur lors de l'attribution du créneau" }, { status: 500 })
  }
}
