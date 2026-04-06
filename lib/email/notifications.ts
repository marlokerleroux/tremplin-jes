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

// Récupérer la configuration SMTP depuis la base de données
async function getSMTPConfig(): Promise<SMTPConfig | null> {
  try {
    const data = await prisma.smtpConfig.findFirst()

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

// 1. Envoyer l'email de bienvenue
export async function sendWelcomeEmail(email: string, firstName: string, lastName: string) {
  const smtpConfig = await getSMTPConfig()
  if (!smtpConfig) {
    console.error("[email] SMTP not configured, skipping welcome email")
    return { success: false, error: "SMTP not configured" }
  }

  const template = getWelcomeEmail({ firstName, lastName })
  return await sendEmail(email, template, smtpConfig)
}

// 2. Envoyer l'email de confirmation de candidature
export async function sendApplicationSubmittedEmail(
  email: string,
  firstName: string,
  lastName: string,
  applicationType: string,
) {
  const smtpConfig = await getSMTPConfig()
  if (!smtpConfig) {
    console.error("[email] SMTP not configured, skipping application submitted email")
    return { success: false, error: "SMTP not configured" }
  }

  const template = getApplicationSubmittedEmail({ firstName, lastName, applicationType })
  return await sendEmail(email, template, smtpConfig)
}

// 3. Envoyer l'email de confirmation de fiche technique
export async function sendTechnicalSheetSubmittedEmail(email: string, firstName: string, lastName: string) {
  const smtpConfig = await getSMTPConfig()
  if (!smtpConfig) {
    console.error("[email] SMTP not configured, skipping technical sheet submitted email")
    return { success: false, error: "SMTP not configured" }
  }

  const template = getTechnicalSheetSubmittedEmail({ firstName, lastName })
  return await sendEmail(email, template, smtpConfig)
}

export { sendTechnicalSheetSubmittedEmail as sendTechnicalSheetUploadedEmail }

// 4. Envoyer l'email de validation de candidature
export async function sendApplicationValidatedEmail(email: string, firstName: string, lastName: string) {
  const smtpConfig = await getSMTPConfig()
  if (!smtpConfig) {
    console.error("[email] SMTP not configured, skipping application validated email")
    return { success: false, error: "SMTP not configured" }
  }

  const template = getApplicationValidatedEmail({ firstName, lastName })
  return await sendEmail(email, template, smtpConfig)
}

// 5. Envoyer l'email d'attribution de créneau
export async function sendTimeSlotAssignedEmail(
  email: string,
  firstName: string,
  lastName: string,
  date: string,
  time: string,
  venue: string,
) {
  const smtpConfig = await getSMTPConfig()
  if (!smtpConfig) {
    console.error("[email] SMTP not configured, skipping time slot assigned email")
    return { success: false, error: "SMTP not configured" }
  }

  const template = getTimeSlotAssignedEmail({ firstName, lastName, date, time, venue })
  return await sendEmail(email, template, smtpConfig)
}

// 6. Envoyer l'email de réinitialisation de mot de passe
export async function sendPasswordResetEmail(
  email: string,
  firstName: string,
  lastName: string,
  resetUrl: string,
) {
  const smtpConfig = await getSMTPConfig()
  if (!smtpConfig) {
    console.error("[email] SMTP not configured, skipping password reset email")
    return { success: false, error: "SMTP not configured" }
  }

  const template = getPasswordResetEmail({ firstName, lastName, resetUrl })
  return await sendEmail(email, template, smtpConfig)
}
