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

export function createTransport(smtpConfig: SMTPConfig) {
  return nodemailer.createTransport({
    host: smtpConfig.smtp_host,
    port: smtpConfig.smtp_port,
    secure: smtpConfig.smtp_secure,
    auth: {
      user: smtpConfig.smtp_username,
      pass: smtpConfig.smtp_password,
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  })
}

export async function sendEmail(
  to: string,
  template: EmailTemplate,
  smtpConfig: SMTPConfig,
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = createTransport(smtpConfig)
    await transporter.sendMail({
      from: { name: smtpConfig.smtp_from_name, address: smtpConfig.smtp_from_email },
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

/** Vérifie la connexion SMTP et envoie un email de test à l'expéditeur. */
export async function sendTestEmail(smtpConfig: SMTPConfig): Promise<{ success: boolean; message: string }> {
  try {
    const transporter = createTransport(smtpConfig)
    await transporter.verify()
    await transporter.sendMail({
      from: { name: smtpConfig.smtp_from_name, address: smtpConfig.smtp_from_email },
      to: smtpConfig.smtp_from_email,
      subject: "Test de configuration SMTP - Tremplin Jeunes en Scène",
      text: "Ceci est un email de test pour vérifier la configuration SMTP. Si vous recevez ce message, votre configuration est correcte.",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #246BDC;">Test de configuration SMTP</h2>
          <p>Ceci est un email de test pour vérifier la configuration SMTP.</p>
          <p>Si vous recevez ce message, votre configuration est correcte et vous pouvez commencer à envoyer des notifications aux candidats.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            Tremplin Jeunes en Scène<br>
            Email envoyé automatiquement, merci de ne pas répondre.
          </p>
        </div>
      `,
    })
    return { success: true, message: `Email de test envoyé avec succès à ${smtpConfig.smtp_from_email}` }
  } catch (error) {
    console.error("[smtp] SMTP test error:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erreur lors du test de connexion SMTP",
    }
  }
}
