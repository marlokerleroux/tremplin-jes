import { NextResponse } from "next/server"
import { requireApiUser } from "@/lib/auth-helpers"
import { resendVerification } from "@/lib/email-verification"
import { resendVerificationSchema } from "@/lib/validation/results"
import { formatZodError } from "@/lib/validation/common"
import { getClientIp, hitRateLimit, RATE_LIMITS } from "@/lib/rate-limit"

/** Renvoie le lien de vérification de l'adresse email (avec correction d'adresse facultative). */
export async function POST(request: Request) {
  try {
    const authResult = await requireApiUser()
    if (!authResult.ok) return authResult.response

    const ip = getClientIp(request)
    const userId = authResult.session.user.id
    const [byIp, byAccount] = await Promise.all([
      hitRateLimit(`verify-resend:${ip}`, RATE_LIMITS.verificationResendPerIp.limit, RATE_LIMITS.verificationResendPerIp.windowMs),
      hitRateLimit(`verify-resend-account:${userId}`, RATE_LIMITS.verificationResendPerAccount.limit, RATE_LIMITS.verificationResendPerAccount.windowMs),
    ])
    if (byIp.limited || byAccount.limited) {
      return NextResponse.json({ error: "Trop de demandes, réessayez dans une heure" }, { status: 429 })
    }

    const parsed = resendVerificationSchema.safeParse((await request.json().catch(() => ({}))) ?? {})
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }

    const outcome = await resendVerification(userId, parsed.data.email)
    if (!outcome.ok) {
      return NextResponse.json({ error: outcome.error }, { status: outcome.status })
    }
    return NextResponse.json({ success: true, email: outcome.email })
  } catch (error) {
    console.error("Resend verification error:", error)
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 })
  }
}
