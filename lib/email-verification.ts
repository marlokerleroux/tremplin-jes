import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { getSiteUrl } from "@/lib/site-url"
import { sendVerificationEmail, sendWelcomeEmail, type EmailResult } from "@/lib/email/notifications"

/**
 * Vérification de l'adresse email des candidats : un jeton à usage unique est envoyé à l'inscription
 * (et sur demande) ; la candidature ne peut être déposée qu'une fois l'adresse confirmée.
 * Les comptes créés avant cette fonctionnalité sont considérés comme vérifiés (migration).
 */

export const VERIFICATION_TOKEN_TTL_MS = 48 * 60 * 60 * 1000
/** Délai minimal entre deux envois pour un même compte. */
export const VERIFICATION_RESEND_COOLDOWN_MS = 60 * 1000

export function verificationUrl(token: string): string {
  return `${getSiteUrl()}/auth/verify-email?token=${token}`
}

async function issueToken(profileId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex")
  await prisma.profile.update({
    where: { id: profileId },
    data: { email_verification_token: token, email_verification_sent_at: new Date() },
  })
  return token
}

/** Émet un jeton et envoie l'email de bienvenue avec le lien de confirmation. */
export async function sendWelcomeWithVerification(profile: { id: string; email: string; first_name: string; last_name: string }): Promise<EmailResult> {
  const token = await issueToken(profile.id)
  return sendWelcomeEmail(profile.email, profile.first_name, profile.last_name, verificationUrl(token))
}

export type ResendOutcome = { ok: true; email: string } | { ok: false; error: string; status: number }

/** Renvoie le lien de vérification, éventuellement vers une adresse corrigée. */
export async function resendVerification(profileId: string, newEmail: string | null): Promise<ResendOutcome> {
  const profile = await prisma.profile.findUnique({ where: { id: profileId } })
  if (!profile) return { ok: false, error: "Compte introuvable", status: 404 }
  if (profile.email_verified_at) return { ok: false, error: "Votre adresse email est déjà vérifiée", status: 400 }

  const sentAt = profile.email_verification_sent_at?.getTime() ?? 0
  const emailChanged = Boolean(newEmail && newEmail !== profile.email)
  if (!emailChanged && Date.now() - sentAt < VERIFICATION_RESEND_COOLDOWN_MS) {
    return { ok: false, error: "Un email vient d'être envoyé, patientez une minute avant de réessayer", status: 429 }
  }

  if (emailChanged && newEmail) {
    const taken = await prisma.profile.findFirst({ where: { email: { equals: newEmail, mode: "insensitive" }, id: { not: profile.id } } })
    if (taken) return { ok: false, error: "Un compte existe déjà avec cet email", status: 400 }
    await prisma.profile.update({ where: { id: profile.id }, data: { email: newEmail } })
  }

  const email = newEmail && emailChanged ? newEmail : profile.email
  const token = await issueToken(profile.id)
  const result = await sendVerificationEmail(email, profile.first_name, profile.last_name, verificationUrl(token))
  if (!result.success) {
    return { ok: false, error: "L'email n'a pas pu être envoyé, réessayez plus tard", status: 500 }
  }
  return { ok: true, email }
}

export type VerifyOutcome = "verified" | "already_verified" | "invalid" | "expired"

/** Confirme l'adresse à partir du jeton reçu par email. */
export async function verifyEmailToken(token: string): Promise<{ outcome: VerifyOutcome; profileId?: string }> {
  if (!/^[a-f0-9]{64}$/.test(token)) return { outcome: "invalid" }
  const profile = await prisma.profile.findUnique({ where: { email_verification_token: token } })
  if (!profile) return { outcome: "invalid" }
  if (profile.email_verified_at) return { outcome: "already_verified", profileId: profile.id }
  const sentAt = profile.email_verification_sent_at?.getTime() ?? 0
  if (Date.now() - sentAt > VERIFICATION_TOKEN_TTL_MS) return { outcome: "expired", profileId: profile.id }
  await prisma.profile.update({
    where: { id: profile.id },
    data: { email_verified_at: new Date(), email_verification_token: null },
  })
  return { outcome: "verified", profileId: profile.id }
}
