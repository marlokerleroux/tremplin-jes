import { prisma } from "@/lib/prisma"

export interface RateLimitResult {
  limited: boolean
  remaining: number
}

/**
 * Limitation de débit persistée en base (fonctionne sur plusieurs instances serverless).
 * Enregistre un « hit » pour la clé et refuse au-delà de `limit` hits dans la fenêtre.
 */
export async function hitRateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const since = new Date(Date.now() - windowMs)
  try {
    const count = await prisma.rateLimitHit.count({ where: { key, created_at: { gte: since } } })
    if (count >= limit) {
      return { limited: true, remaining: 0 }
    }
    await prisma.rateLimitHit.create({ data: { key } })
    // Nettoyage opportuniste des anciennes entrées (toutes clés confondues).
    if (Math.random() < 0.05) {
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      await prisma.rateLimitHit.deleteMany({ where: { created_at: { lt: dayAgo } } })
    }
    return { limited: false, remaining: limit - count - 1 }
  } catch (error) {
    // En cas d'erreur base, on laisse passer plutôt que de bloquer le service.
    console.error("[rate-limit] error:", error)
    return { limited: false, remaining: limit }
  }
}

/** Adresse IP du client (derrière le proxy Vercel). */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return request.headers.get("x-real-ip") ?? "unknown"
}

export const RATE_LIMITS = {
  login: { limit: 10, windowMs: 15 * 60 * 1000 },
  forgotPassword: { limit: 3, windowMs: 60 * 60 * 1000 },
  signupPerIp: { limit: 20, windowMs: 60 * 60 * 1000 },
  resetPasswordPerIp: { limit: 10, windowMs: 15 * 60 * 1000 },
} as const
