import nodemailer from "nodemailer"
import type { EmailTemplate } from "./templates"

export interface SMTPConfig {
  smtp_host: string
  smtp_port: number
  smtp_username: string
  smtp_password: string
  smtp_from_email: string
  smtp_from_name: string
  smtp_secure: boolean
}

export async function sendEmail(
  to: string,
  template: EmailTemplate,
  smtpConfig: SMTPConfig,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Créer le transporteur nodemailer
    const transporter = nodemailer.createTransport({
      host: smtpConfig.smtp_host,
      port: smtpConfig.smtp_port,
      secure: smtpConfig.smtp_secure,
      auth: {
        user: smtpConfig.smtp_username,
        pass: smtpConfig.smtp_password,
      },
    })

    // Envoyer l'email
    await transporter.sendMail({
      from: `"${smtpConfig.smtp_from_name}" <${smtpConfig.smtp_from_email}>`,
      to,
      subject: template.subject,
      text: template.text,
      html: template.html,
    })

    return { success: true }
  } catch (error) {
    console.error("[email] Error sending email:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
