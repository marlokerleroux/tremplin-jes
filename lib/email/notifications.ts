import { prisma } from "@/lib/prisma"
import { getSiteUrl } from "@/lib/site-url"
import { formatDateFr } from "@/lib/season"
import { sendEmail, type SMTPConfig } from "./mailer"
import {
  getAdminNotificationEmail,
  getApplicationSubmittedEmail,
  getPasswordResetEmail,
  getTechnicalSheetSubmittedEmail,
  getVerificationEmail,
  getWelcomeEmail,
  type EmailTemplate,
} from "./templates"
import { candidateVars, renderEmail } from "./template-store"
import { buildAuditionIcs } from "./ics"
import type { ReminderKind } from "@/lib/reminders"
import type { DossierReminderKind } from "@/lib/dossier-reminders"

export type EmailResult = { success: boolean; error?: string }

/** Configuration SMTP depuis la base de données (null si non configurée). */
export async function getSMTPConfig(): Promise<SMTPConfig | null> {
  try {
    const data = await prisma.smtpConfig.findFirst({ orderBy: { created_at: "asc" } })
    if (!data) {
      console.error("[email] No SMTP config found in database")
      return null
    }
    return {
      smtp_host: data.smtp_host,
      smtp_port: data.smtp_port,
      smtp_username: data.smtp_username,
      smtp_password: data.smtp_password,
      smtp_from_email: data.smtp_from_email,
      smtp_from_name: data.smtp_from_name,
      smtp_secure: data.smtp_secure,
    }
  } catch (error) {
    console.error("[email] Error in getSMTPConfig:", error)
    return null
  }
}

async function deliver(to: string | string[], build: () => EmailTemplate | Promise<EmailTemplate>, label: string): Promise<EmailResult> {
  const smtpConfig = await getSMTPConfig()
  if (!smtpConfig) {
    console.error(`[email] SMTP not configured, skipping ${label} email`)
    return { success: false, error: "SMTP not configured" }
  }
  try {
    return await sendEmail(to, await build(), smtpConfig)
  } catch (error) {
    console.error(`[email] Error building ${label} email:`, error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/** Données minimales d'un candidat pour les emails à modèle modifiable. */
export interface CandidateEmailInput {
  email: string
  firstName: string
  lastName: string
  stageName: string
  edition: number
}

export interface AuditionEmailInput extends CandidateEmailInput {
  applicationId: string
  date: string // YYYY-MM-DD
  startTime: string // HH:MM
  endTime: string // HH:MM
  venue: string
}

function auditionVars(input: AuditionEmailInput) {
  return candidateVars({
    firstName: input.firstName,
    lastName: input.lastName,
    stageName: input.stageName,
    edition: input.edition,
    auditionDate: formatDateFr(input.date),
    auditionTime: input.startTime,
    venue: input.venue,
  })
}

// 1. Bienvenue après création du compte (avec lien de vérification)
export function sendWelcomeEmail(email: string, firstName: string, lastName: string, verifyUrl: string) {
  return deliver(email, () => getWelcomeEmail({ firstName, lastName, verifyUrl }), "welcome")
}

// 1 bis. Renvoi du lien de vérification
export function sendVerificationEmail(email: string, firstName: string, lastName: string, verifyUrl: string) {
  return deliver(email, () => getVerificationEmail({ firstName, lastName, verifyUrl }), "verification")
}

// 2. Confirmation de candidature
export function sendApplicationSubmittedEmail(email: string, firstName: string, lastName: string, applicationType: string) {
  return deliver(email, () => getApplicationSubmittedEmail({ firstName, lastName, applicationType }), "application submitted")
}

// 3. Confirmation de fiche technique
export function sendTechnicalSheetSubmittedEmail(email: string, firstName: string, lastName: string) {
  return deliver(email, () => getTechnicalSheetSubmittedEmail({ firstName, lastName }), "technical sheet")
}

// 4. Validation de candidature (modèle modifiable)
export function sendApplicationValidatedEmail(candidate: CandidateEmailInput) {
  return deliver(candidate.email, () => renderEmail("application_validated", candidateVars(candidate)), "application validated")
}

// 4 bis. Refus de candidature (modèle modifiable)
export function sendApplicationRejectedEmail(candidate: CandidateEmailInput) {
  return deliver(candidate.email, () => renderEmail("application_rejected", candidateVars(candidate)), "application rejected")
}

// 5. Convocation (modèle modifiable) avec invitation calendrier
export function sendTimeSlotAssignedEmail(input: AuditionEmailInput) {
  return deliver(
    input.email,
    async () => {
      const email = await renderEmail("time_slot_assigned", auditionVars(input))
      const ics = buildAuditionIcs({
        uid: `audition-${input.applicationId}@tremplin-jeunes-en-scene.fr`,
        date: input.date,
        startTime: input.startTime,
        endTime: input.endTime,
        summary: `Audition Tremplin Jeunes en Scène : ${input.stageName}`,
        description: `Audition de ${input.stageName} (édition ${input.edition}). Présentez-vous 30 minutes avant votre heure de passage.\n${getSiteUrl()}/dashboard`,
        location: input.venue,
      })
      if (ics) {
        email.attachments = [{ filename: "audition-tremplin.ics", content: ics, contentType: "text/calendar; charset=utf-8; method=PUBLISH" }]
      }
      return email
    },
    "time slot assigned",
  )
}

// 5 bis. Rappels J-7 / J-1 (modèles modifiables)
export function sendReminderEmail(kind: ReminderKind, input: AuditionEmailInput) {
  return deliver(input.email, () => renderEmail(kind === "j7" ? "reminder_j7" : "reminder_j1", auditionVars(input)), `reminder ${kind}`)
}

// 5 ter. Relances des dossiers incomplets (modèles modifiables)
export function sendDossierReminderEmail(
  kind: DossierReminderKind,
  input: CandidateEmailInput & { missingDocuments: string; closingDate: string },
) {
  return deliver(
    input.email,
    () => renderEmail(kind === "final" ? "dossier_incomplete_final" : "dossier_incomplete", candidateVars(input)),
    `dossier reminder ${kind}`,
  )
}

// 5 quater. Résultats des auditions (modèles modifiables)
export function sendResultEmail(selected: boolean, candidate: CandidateEmailInput) {
  return deliver(
    candidate.email,
    () => renderEmail(selected ? "results_selected" : "results_not_selected", candidateVars(candidate)),
    selected ? "results selected" : "results not selected",
  )
}

// 6. Réinitialisation de mot de passe
export function sendPasswordResetEmail(email: string, firstName: string, lastName: string, resetUrl: string) {
  return deliver(email, () => getPasswordResetEmail({ firstName, lastName, resetUrl }), "password reset")
}

// 7. Notification interne aux administrateurs (jamais bloquante)
export async function notifyAdmins(title: string, lines: string[]): Promise<EmailResult> {
  try {
    const admins = await prisma.profile.findMany({ where: { role: "admin" }, select: { email: true } })
    const recipients = admins.map((a) => a.email).filter(Boolean)
    if (recipients.length === 0) return { success: false, error: "No admin account" }
    return await deliver(recipients, () => getAdminNotificationEmail({ title, lines, adminUrl: `${getSiteUrl()}/admin` }), "admin notification")
  } catch (error) {
    console.error("[email] admin notification failed:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
