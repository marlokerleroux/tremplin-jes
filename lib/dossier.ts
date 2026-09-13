import { prisma } from "@/lib/prisma"
import { normalizeGroupMembers } from "@/lib/admin-data"
import { getSeasonConfig } from "@/lib/season-config"
import { getAgeReferenceDate, isMinorAt } from "@/lib/season"
import { notifyAdmins } from "@/lib/email/notifications"

/**
 * Complétude d'un dossier : fiche technique présente et autorisation parentale pour chaque membre mineur.
 * Utilisé pour prévenir l'administration dès qu'un dossier devient complet.
 */
export async function isDossierComplete(applicationId: string): Promise<boolean> {
  const [application, config] = await Promise.all([
    prisma.application.findUnique({
      where: { id: applicationId },
      select: {
        group_members: true,
        technical_sheet: { select: { pdf_url: true } },
        parental_authorizations: { select: { member_index: true } },
      },
    }),
    getSeasonConfig(),
  ])
  if (!application || !application.technical_sheet?.pdf_url) return false
  const referenceDate = getAgeReferenceDate(config)
  const members = normalizeGroupMembers(application.group_members)
  const provided = new Set(application.parental_authorizations.map((a) => a.member_index))
  return members.every((member, index) => !member.birthDate || !isMinorAt(member.birthDate, referenceDate) || provided.has(index))
}

/** Prévient l'administration si le dossier vient d'être complété (jamais bloquant). */
export async function notifyAdminsIfComplete(application: {
  id: string
  stage_name: string
  edition: number
  profile: { first_name: string; last_name: string; email: string }
}): Promise<void> {
  try {
    if (!(await isDossierComplete(application.id))) return
    await notifyAdmins(`Dossier complet : ${application.stage_name}`, [
      `Le dossier de ${application.stage_name} (édition ${application.edition}) est complet et peut être validé.`,
      `Candidat : ${application.profile.first_name} ${application.profile.last_name} · ${application.profile.email}`,
    ])
  } catch (error) {
    console.error("[dossier] admin notification failed:", error)
  }
}
