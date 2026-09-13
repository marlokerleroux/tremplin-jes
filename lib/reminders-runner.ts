import { prisma } from "@/lib/prisma"
import { DEFAULT_VENUE, getSeasonConfig } from "@/lib/season-config"
import { dueReminders, todayInParis, type ReminderKind } from "@/lib/reminders"
import { sendReminderEmail } from "@/lib/email/notifications"
import { EMAIL_BATCH_SIZE, mapInBatches } from "@/lib/batch"

export interface RemindersRunResult {
  today: string
  scheduleValidated: boolean
  candidates: number
  sent: { j7: number; j1: number }
  failed: string[]
}

/**
 * Envoie les rappels J-7 et J-1 dus aujourd'hui (planning validé, candidatures non refusées avec créneau).
 * Idempotent : chaque rappel envoyé est horodaté sur la candidature.
 */
export async function runReminders(now = new Date()): Promise<RemindersRunResult> {
  const today = todayInParis(now)
  const config = await getSeasonConfig()
  const result: RemindersRunResult = { today, scheduleValidated: config.is_validated, candidates: 0, sent: { j7: 0, j1: 0 }, failed: [] }
  if (!config.is_validated) return result

  const applications = await prisma.application.findMany({
    where: { edition: config.edition, status: { not: "rejected" }, time_slot_id: { not: null } },
    select: {
      id: true,
      stage_name: true,
      edition: true,
      reminder_j7_sent_at: true,
      reminder_j1_sent_at: true,
      profile: { select: { email: true, first_name: true, last_name: true } },
      time_slot: { select: { date: true, start_time: true, end_time: true } },
    },
  })
  result.candidates = applications.length
  const venue = config.venue || DEFAULT_VENUE

  const field: Record<ReminderKind, "reminder_j7_sent_at" | "reminder_j1_sent_at"> = { j7: "reminder_j7_sent_at", j1: "reminder_j1_sent_at" }
  const jobs = applications.flatMap((app) =>
    app.time_slot ? dueReminders(app.time_slot.date, today, app).map((kind) => ({ app, slot: app.time_slot!, kind })) : [],
  )
  await mapInBatches(jobs, EMAIL_BATCH_SIZE, async ({ app, slot, kind }) => {
    const sent = await sendReminderEmail(kind, {
      applicationId: app.id,
      email: app.profile.email,
      firstName: app.profile.first_name,
      lastName: app.profile.last_name,
      stageName: app.stage_name,
      edition: app.edition,
      date: slot.date,
      startTime: slot.start_time,
      endTime: slot.end_time,
      venue,
    })
    if (!sent.success) {
      result.failed.push(`${app.stage_name} (${kind.toUpperCase()})`)
      return
    }
    await prisma.application.update({ where: { id: app.id }, data: { [field[kind]]: now } })
    result.sent[kind]++
  })
  return result
}
