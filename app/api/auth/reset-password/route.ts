import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { resetPasswordSchema } from "@/lib/validation/auth"
import { formatZodError } from "@/lib/validation/common"
import { getClientIp, hitRateLimit, RATE_LIMITS } from "@/lib/rate-limit"

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    const { limited } = await hitRateLimit(
      `reset-ip:${ip}`,
      RATE_LIMITS.resetPasswordPerIp.limit,
      RATE_LIMITS.resetPasswordPerIp.windowMs,
    )
    if (limited) {
      return NextResponse.json({ error: "Trop de tentatives, réessayez plus tard" }, { status: 429 })
    }

    const parsed = resetPasswordSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }
    const { token, password } = parsed.data

    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } })
    if (!resetToken || resetToken.used || resetToken.expires_at < new Date()) {
      return NextResponse.json({ error: "Lien de réinitialisation invalide ou expiré" }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await prisma.$transaction([
      prisma.profile.update({
        where: { id: resetToken.profile_id },
        data: { password_hash: passwordHash },
      }),
      prisma.passwordResetToken.updateMany({
        where: { profile_id: resetToken.profile_id, used: false },
        data: { used: true },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 })
  }
}
