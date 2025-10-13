import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request: Request) {
  try {
    const config = await request.json()

    // Create transporter with provided SMTP config
    const transporter = nodemailer.createTransport({
      host: config.smtp_host,
      port: config.smtp_port,
      secure: config.smtp_secure,
      auth: {
        user: config.smtp_username,
        pass: config.smtp_password,
      },
    })

    // Verify connection configuration
    await transporter.verify()

    // Send test email
    await transporter.sendMail({
      from: `"${config.smtp_from_name}" <${config.smtp_from_email}>`,
      to: config.smtp_from_email, // Send to the same email for testing
      subject: "Test de configuration SMTP - Tremplin Musical Breton",
      text: "Ceci est un email de test pour vérifier la configuration SMTP. Si vous recevez ce message, votre configuration est correcte.",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #246BDC;">Test de configuration SMTP</h2>
          <p>Ceci est un email de test pour vérifier la configuration SMTP.</p>
          <p>Si vous recevez ce message, votre configuration est correcte et vous pouvez commencer à envoyer des notifications aux candidats.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            Tremplin Musical Breton<br>
            Email envoyé automatiquement, merci de ne pas répondre.
          </p>
        </div>
      `,
    })

    return NextResponse.json({
      success: true,
      message: `Email de test envoyé avec succès à ${config.smtp_from_email}`,
    })
  } catch (error: any) {
    console.error("[v0] SMTP test error:", error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Erreur lors du test de connexion SMTP",
      },
      { status: 500 },
    )
  }
}
