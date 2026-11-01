import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiAdmin } from "@/lib/auth-helpers"
import { getSeasonConfig, serializeSeasonConfig } from "@/lib/season-config"
import { dossierReminderSettingsSchema } from "@/lib/validation/admin"
import { formatZodError } from "@/lib/validation/common"

/** Réglages des relances des dossiers incomplets (activation, fréquence, relance renforcée avant la clôture). */
export async function PUT(request: Request) {
  const authResult = await requireApiAdmin()
  if (!authResult.ok) return authResult.response

  try {
    const parsed = dossierReminderSettingsSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }
    const existing = await getSeasonConfig()
    const config = await prisma.scheduleConfig.update({
      where: { id: existing.id },
      data: {
        dossier_reminders_enabled: parsed.data.enabled,
        dossier_reminder_interval_days: parsed.data.intervalDays,
        dossier_reminder_final_days: parsed.data.finalDays,
      },
    })
    return NextResponse.json({ success: true, config: serializeSeasonConfig(config) })
  } catch (error) {
    console.error("Error updating dossier reminder settings:", error)
    return NextResponse.json({ error: "Erreur lors de l'enregistrement des réglages" }, { status: 500 })
  }
}
