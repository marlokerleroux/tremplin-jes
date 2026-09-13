import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { signupSchema } from "@/lib/validation/auth"
import { formatZodError } from "@/lib/validation/common"
import { getClientIp, hitRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { getSeasonState } from "@/lib/season-config"
import { sendWelcomeWithVerification } from "@/lib/email-verification"

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    const { limited } = await hitRateLimit(`signup:${ip}`, RATE_LIMITS.signupPerIp.limit, RATE_LIMITS.signupPerIp.windowMs)
    if (limited) {
      return NextResponse.json({ error: "Trop de tentatives, réessayez dans une heure" }, { status: 429 })
    }

    const parsed = signupSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }
    const data = parsed.data

    const season = await getSeasonState()
    if (season.registration !== "open") {
      return NextResponse.json({ error: "Les inscriptions ne sont pas ouvertes" }, { status: 403 })
    }

    const passwordHash = await bcrypt.hash(data.password, 12)

    let profile
    try {
      profile = await prisma.profile.create({
        data: {
          email: data.email,
          password_hash: passwordHash,
          first_name: data.firstName,
          last_name: data.lastName,
          street_address: data.streetAddress,
          city: data.city,
          postal_code: data.postalCode,
          phone: data.phone,
          role: "user",
          accepted_privacy_policy: true,
          privacy_policy_accepted_at: new Date(),
        },
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return NextResponse.json({ error: "Un compte existe déjà avec cet email" }, { status: 400 })
      }
      throw error
    }

    // Email de bienvenue avec lien de vérification (non bloquant : l'échec est journalisé, le compte est créé).
    const email = await sendWelcomeWithVerification(profile)

    return NextResponse.json({ success: true, verificationEmailSent: email.success })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Erreur lors de la création du compte" }, { status: 500 })
  }
}
