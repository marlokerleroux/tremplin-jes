import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiAdmin } from "@/lib/auth-helpers"
import { getSeasonConfig, serializeSeasonConfig, DEFAULT_VENUE } from "@/lib/season-config"
import { sendTimeSlotAssignedEmail } from "@/lib/email/notifications"
import { formatDateFr } from "@/lib/season"

/** Valide le planning (le rend visible aux candidats) et envoie les convocations. */
export async function POST() {
  const authResult = await requireApiAdmin()
  if (!authResult.ok) return authResult.response

  try {
    const existing = await getSeasonConfig()
    const config = await prisma.scheduleConfig.update({
      where: { id: existing.id },
      data: { is_validated: true },
    })

    const applications = await prisma.application.findMany({
      where: { edition: config.edition, time_slot_id: { not: null }, status: { not: "rejected" } },
      select: {
        id: true,
        profile: { select: { email: true, first_name: true, last_name: true } },
        time_slot: { select: { date: true, start_time: true } },
      },
    })

    const venue = config.venue || DEFAULT_VENUE
    let sent = 0
    const failed: string[] = []
    for (const app of applications) {
      if (!app.time_slot) continue
      const result = await sendTimeSlotAssignedEmail(
        app.profile.email,
        app.profile.first_name,
        app.profile.last_name,
        formatDateFr(app.time_slot.date),
        app.time_slot.start_time,
        venue,
      )
      if (result.success) sent++
      else failed.push(app.profile.email)
    }

    return NextResponse.json({ success: true, config: serializeSeasonConfig(config), emails: { sent, failed } })
  } catch (error) {
    console.error("Error validating schedule:", error)
    return NextResponse.json({ error: "Erreur lors de la validation du planning" }, { status: 500 })
  }
}
