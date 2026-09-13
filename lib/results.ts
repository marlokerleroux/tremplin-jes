import { prisma } from "@/lib/prisma"
import { getSeasonConfig } from "@/lib/season-config"
import { sendResultEmail } from "@/lib/email/notifications"
import { EMAIL_BATCH_SIZE, mapInBatches } from "@/lib/batch"

export interface ResultsSendReport {
  selected: number
  notSelected: number
  skipped: number
  failed: string[]
}

/** Candidatures concernées par les résultats : validées (donc auditionnées) pour l'édition en cours. */
export function resultsAudienceWhere(edition: number) {
  return { edition, status: "validated", profile: { role: { not: "admin" } } } as const
}

/**
 * Envoie l'email de résultat (finaliste / non retenu) à chaque candidature validée de l'édition.
 * Sans `resend`, les candidatures déjà informées sont ignorées.
 */
export async function sendResults(options: { resend: boolean }): Promise<ResultsSendReport> {
  const config = await getSeasonConfig()
  const applications = await prisma.application.findMany({
    where: resultsAudienceWhere(config.edition),
    select: {
      id: true,
      stage_name: true,
      edition: true,
      is_finalist: true,
      result_sent_at: true,
      profile: { select: { email: true, first_name: true, last_name: true } },
    },
    orderBy: { stage_name: "asc" },
  })

  const report: ResultsSendReport = { selected: 0, notSelected: 0, skipped: 0, failed: [] }
  const pending = applications.filter((app) => {
    if (app.result_sent_at && !options.resend) {
      report.skipped++
      return false
    }
    return true
  })
  await mapInBatches(pending, EMAIL_BATCH_SIZE, async (app) => {
    const sent = await sendResultEmail(app.is_finalist, {
      email: app.profile.email,
      firstName: app.profile.first_name,
      lastName: app.profile.last_name,
      stageName: app.stage_name,
      edition: app.edition,
    })
    if (!sent.success) {
      report.failed.push(app.stage_name)
      return
    }
    await prisma.application.update({ where: { id: app.id }, data: { result_sent_at: new Date() } })
    if (app.is_finalist) report.selected++
    else report.notSelected++
  })
  return report
}
