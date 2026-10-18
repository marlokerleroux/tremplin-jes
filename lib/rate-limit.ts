import { prisma } from "@/lib/prisma"

export interface RateLimitResult {
  limited: boolean
  remaining: number
}

/**
 * Limitation de débit persistée en base (fonctionne sur plusieurs instances serverless).
 * Le « hit » est enregistré AVANT le comptage : des requêtes simultanées se voient donc
 * mutuellement et ne peuvent pas contourner la limite.
 */
export async function hitRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  options: { failClosed?: boolean } = {},
): Promise<RateLimitResult> {
  const since = new Date(Date.now() - windowMs)
  try {
    await prisma.rateLimitHit.create({ data: { key } })
    const count = await prisma.rateLimitHit.count({ where: { key, created_at: { gte: since } } })
    // Nettoyage opportuniste des anciennes entrées (toutes clés confondues).
    if (Math.random() < 0.05) {
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      await prisma.rateLimitHit.deleteMany({ where: { created_at: { lt: dayAgo } } })
    }
    return { limited: count > limit, remaining: Math.max(0, limit - count) }
  } catch (error) {
    // En cas d'erreur base, on laisse passer plutôt que de bloquer le service,
    // sauf pour les limites qui protègent les mots de passe (connexion, réinitialisation).
    console.error("[rate-limit] error:", error)
    return options.failClosed ? { limited: true, remaining: 0 } : { limited: false, remaining: limit }
  }
}

/** Adresse IP du client (derrière le proxy Vercel). */
export function getClientIp(request: Request | { headers: Headers } | undefined): string {
  const headers = request?.headers
  if (!headers) return "unknown"
  const forwarded = headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return headers.get("x-real-ip") ?? "unknown"
}

export const RATE_LIMITS = {
  /** Par couple email + IP : un tiers ne peut pas bloquer un compte depuis une autre adresse. */
  login: { limit: 10, windowMs: 15 * 60 * 1000 },
  /** Par IP, toutes adresses email confondues (pulvérisation de mots de passe). */
  loginPerIp: { limit: 50, windowMs: 15 * 60 * 1000 },
  forgotPassword: { limit: 3, windowMs: 60 * 60 * 1000 },
  signupPerIp: { limit: 20, windowMs: 60 * 60 * 1000 },
  resetPasswordPerIp: { limit: 10, windowMs: 15 * 60 * 1000 },
  verificationResendPerIp: { limit: 6, windowMs: 60 * 60 * 1000 },
  /** Par compte : limite les emails de vérification envoyés (y compris vers une adresse corrigée). */
  verificationResendPerAccount: { limit: 4, windowMs: 60 * 60 * 1000 },
  /** Par candidature : chaque dépôt de document envoie un email de confirmation. */
  documentUploadPerApplication: { limit: 20, windowMs: 60 * 60 * 1000 },
} as const
