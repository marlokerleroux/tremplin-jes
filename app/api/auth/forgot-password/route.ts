import { NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { forgotPasswordSchema } from "@/lib/validation/auth"
import { formatZodError } from "@/lib/validation/common"
import { getClientIp, hitRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { sendPasswordResetEmail } from "@/lib/email/notifications"
import { getSiteUrl } from "@/lib/site-url"

export async function POST(request: Request) {
  try {
    const parsed = forgotPasswordSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }
    const { email } = parsed.data

    const ip = getClientIp(request)
    const [byEmail, byIp] = await Promise.all([
      hitRateLimit(`forgot:${email}`, RATE_LIMITS.forgotPassword.limit, RATE_LIMITS.forgotPassword.windowMs),
      hitRateLimit(`forgot-ip:${ip}`, RATE_LIMITS.signupPerIp.limit, RATE_LIMITS.signupPerIp.windowMs),
    ])
    if (byEmail.limited || byIp.limited) {
      // Réponse identique au succès pour ne pas révéler l'existence du compte.
      return NextResponse.json({ success: true })
    }

    const profile = await prisma.profile.findUnique({ where: { email } })
    if (!profile) {
      return NextResponse.json({ success: true })
    }

    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 heure

    await prisma.$transaction([
      // Un seul lien actif à la fois : on invalide les précédents.
      prisma.passwordResetToken.updateMany({
        where: { profile_id: profile.id, used: false },
        data: { used: true },
      }),
      prisma.passwordResetToken.create({
        data: { profile_id: profile.id, token, expires_at: expiresAt },
      }),
    ])

    const resetUrl = `${getSiteUrl()}/auth/reset-password?token=${token}`
    const result = await sendPasswordResetEmail(profile.email, profile.first_name, profile.last_name, resetUrl)
    if (!result.success) {
      console.error("[auth] password reset email failed:", result.error)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 })
  }
}
