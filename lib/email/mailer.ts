import nodemailer from "nodemailer"
import { getEmailLayout, infoBox, type EmailTemplate } from "./templates"
import { LOGO_CID, LOGO_FILENAME, LOGO_PNG_BASE64 } from "./logo"

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

/** Pièce jointe inline du logo, ajoutée dès que le HTML y fait référence (cid:). */
function inlineLogoAttachment(html: string) {
  if (!html.includes(`cid:${LOGO_CID}`)) return []
  return [
    {
      filename: LOGO_FILENAME,
      content: Buffer.from(LOGO_PNG_BASE64, "base64"),
      contentType: "image/png",
      cid: LOGO_CID,
      contentDisposition: "inline" as const,
    },
  ]
}

export async function sendEmail(
  to: string | string[],
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
      attachments: [
        ...inlineLogoAttachment(template.html),
        ...(template.attachments ?? []).map((a) => ({ filename: a.filename, content: a.content, contentType: a.contentType })),
      ],
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
    const html = getEmailLayout(`
      <h2>Test de configuration SMTP</h2>
      <p>Ceci est un email de test pour vérifier la configuration SMTP.</p>
      ${infoBox("Si vous recevez ce message, votre configuration est correcte et les emails aux candidats peuvent être envoyés.")}
      <p style="color: #6B6480; font-size: 14px;">Email envoyé automatiquement depuis l'administration.</p>
    `)
    await transporter.sendMail({
      from: { name: smtpConfig.smtp_from_name, address: smtpConfig.smtp_from_email },
      to: smtpConfig.smtp_from_email,
      subject: "Test de configuration SMTP - Tremplin Jeunes en Scène",
      text: "Ceci est un email de test pour vérifier la configuration SMTP. Si vous recevez ce message, votre configuration est correcte.",
      html,
      attachments: inlineLogoAttachment(html),
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
