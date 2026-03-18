import { NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { sendEmail, type SMTPConfig } from "@/lib/email/mailer"
import { getPasswordResetEmail } from "@/lib/email/templates"

async function getSMTPConfig(): Promise<SMTPConfig | null> {
  const data = await prisma.smtpConfig.findFirst()
  if (!data) return null
  return {
    smtp_host: data.smtp_host,
    smtp_port: data.smtp_port,
    smtp_username: data.smtp_username,
    smtp_password: data.smtp_password,
    smtp_from_email: data.smtp_from_email,
    smtp_from_name: data.smtp_from_name,
    smtp_secure: data.smtp_secure,
  }
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 })
    }

    const profile = await prisma.profile.findUnique({ where: { email } })

    // Always return success to prevent email enumeration
    if (!profile) {
      return NextResponse.json({ success: true })
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        profile_id: profile.id,
        token,
        expires_at: expiresAt,
      },
    })

    // Send email
    const smtpConfig = await getSMTPConfig()
    if (smtpConfig) {
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL || "https://candidat.tremplin-jeunes-en-scene.fr"
      const resetUrl = `${siteUrl}/auth/reset-password?token=${token}`
      const template = getPasswordResetEmail({
        firstName: profile.first_name,
        lastName: profile.last_name,
        resetUrl,
      })
      await sendEmail(email, template, smtpConfig)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 },
    )
  }
}
