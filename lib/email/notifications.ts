import { prisma } from "@/lib/prisma"
import { sendEmail, type SMTPConfig } from "./mailer"
import {
  getWelcomeEmail,
  getApplicationSubmittedEmail,
  getTechnicalSheetSubmittedEmail,
  getApplicationValidatedEmail,
  getTimeSlotAssignedEmail,
  getPasswordResetEmail,
} from "./templates"

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

async function deliver(to: string, build: () => ReturnType<typeof getWelcomeEmail>, label: string): Promise<EmailResult> {
  const smtpConfig = await getSMTPConfig()
  if (!smtpConfig) {
    console.error(`[email] SMTP not configured, skipping ${label} email`)
    return { success: false, error: "SMTP not configured" }
  }
  return sendEmail(to, build(), smtpConfig)
}

// 1. Bienvenue après création du compte
export function sendWelcomeEmail(email: string, firstName: string, lastName: string) {
  return deliver(email, () => getWelcomeEmail({ firstName, lastName }), "welcome")
}

// 2. Confirmation de candidature
export function sendApplicationSubmittedEmail(email: string, firstName: string, lastName: string, applicationType: string) {
  return deliver(email, () => getApplicationSubmittedEmail({ firstName, lastName, applicationType }), "application submitted")
}

// 3. Confirmation de fiche technique
export function sendTechnicalSheetSubmittedEmail(email: string, firstName: string, lastName: string) {
  return deliver(email, () => getTechnicalSheetSubmittedEmail({ firstName, lastName }), "technical sheet")
}

// 4. Validation de candidature
export function sendApplicationValidatedEmail(email: string, firstName: string, lastName: string) {
  return deliver(email, () => getApplicationValidatedEmail({ firstName, lastName }), "application validated")
}

// 5. Attribution de créneau
export function sendTimeSlotAssignedEmail(
  email: string,
  firstName: string,
  lastName: string,
  date: string,
  time: string,
  venue: string,
) {
  return deliver(email, () => getTimeSlotAssignedEmail({ firstName, lastName, date, time, venue }), "time slot assigned")
}

// 6. Réinitialisation de mot de passe
export function sendPasswordResetEmail(email: string, firstName: string, lastName: string, resetUrl: string) {
  return deliver(email, () => getPasswordResetEmail({ firstName, lastName, resetUrl }), "password reset")
}
