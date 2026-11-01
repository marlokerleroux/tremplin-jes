import { prisma } from "@/lib/prisma"
import { normalizeGroupMembers } from "@/lib/admin-data"
import { getSeasonConfig } from "@/lib/season-config"
import { formatDateTimeFr, getAgeReferenceDate } from "@/lib/season"
import { sendDossierReminderEmail } from "@/lib/email/notifications"
import { EMAIL_BATCH_SIZE, mapInBatches } from "@/lib/batch"
import {
  dueDossierReminder,
  formatMissingDocuments,
  getMissingDocuments,
  isComplete,
  type DossierReminderSettings,
} from "@/lib/dossier-reminders"

export interface DossierRemindersRunResult {
  enabled: boolean
  closesAt: string | null
  incomplete: number
  sent: { regular: number; final: number }
  failed: string[]
}

export function dossierReminderSettings(config: {
  dossier_reminders_enabled: boolean
  dossier_reminder_interval_days: number
  dossier_reminder_final_days: number
}): DossierReminderSettings {
  return {
    enabled: config.dossier_reminders_enabled,
    intervalDays: config.dossier_reminder_interval_days,
    finalDays: config.dossier_reminder_final_days,
  }
}

/**
 * Relance par email les candidatures en attente de l'édition en cours dont le dossier est incomplet
 * (fiche technique et/ou autorisation parentale d'un membre mineur), jusqu'à la clôture des inscriptions.
 * Idempotent dans la journée : chaque relance envoyée est horodatée sur la candidature.
 */
export async function runDossierReminders(now = new Date()): Promise<DossierRemindersRunResult> {
  const config = await getSeasonConfig()
  const settings = dossierReminderSettings(config)
  const closesAt = config.registration_closes_at
  const result: DossierRemindersRunResult = {
    enabled: settings.enabled,
    closesAt: closesAt?.toISOString() ?? null,
    incomplete: 0,
    sent: { regular: 0, final: 0 },
    failed: [],
  }
  if (!settings.enabled || !closesAt || now >= closesAt) return result

  const applications = await prisma.application.findMany({
    where: { edition: config.edition, status: "pending" },
    select: {
      id: true,
      application_type: true,
      stage_name: true,
      edition: true,
      group_members: true,
      created_at: true,
      dossier_reminder_sent_at: true,
      profile: { select: { email: true, first_name: true, last_name: true } },
      technical_sheet: { select: { pdf_url: true } },
      parental_authorizations: { select: { member_index: true } },
    },
  })
  const ageReferenceDate = getAgeReferenceDate(config)
  const closingDate = formatDateTimeFr(closesAt)

  const jobs = applications.flatMap((app) => {
    const missing = getMissingDocuments({
      members: normalizeGroupMembers(app.group_members),
      hasTechnicalSheet: Boolean(app.technical_sheet?.pdf_url),
      providedAuthorizations: app.parental_authorizations.map((a) => a.member_index),
      ageReferenceDate,
    })
    if (isComplete(missing)) return []
    result.incomplete++
    const kind = dueDossierReminder({ now, closesAt, submittedAt: app.created_at, lastSentAt: app.dossier_reminder_sent_at, settings })
    return kind ? [{ app, kind, missing: formatMissingDocuments(missing, app.application_type === "group") }] : []
  })

  await mapInBatches(jobs, EMAIL_BATCH_SIZE, async ({ app, kind, missing }) => {
    const sent = await sendDossierReminderEmail(kind, {
      email: app.profile.email,
      firstName: app.profile.first_name,
      lastName: app.profile.last_name,
      stageName: app.stage_name,
      edition: app.edition,
      missingDocuments: missing,
      closingDate,
    })
    if (!sent.success) {
      result.failed.push(app.stage_name)
      return
    }
    await prisma.application.update({
      where: { id: app.id },
      data: { dossier_reminder_sent_at: now, dossier_reminder_count: { increment: 1 } },
    })
    result.sent[kind]++
  })
  return result
}
