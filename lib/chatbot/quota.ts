import { createHmac } from "node:crypto"
import { prisma } from "@/lib/prisma"
import { getClientIp } from "@/lib/rate-limit"

const PER_IP_DAILY_LIMIT = 40

/** Shared across Vercel instances; only adds chatbot-prefixed rate-limit records. */
export async function reserveChatbotRequest(request: Request): Promise<boolean> {
  const secret = process.env.AUTH_SECRET || process.env.OPENROUTER_API_KEY
  if (!secret) throw new Error("MISSING_QUOTA_SECRET")
  const now = new Date()
  const day = now.toISOString().slice(0, 10)
  const prefix = `chatbot:v1:${day}:`
  const ipHash = createHmac("sha256", secret).update(`${day}:${getClientIp(request)}`).digest("hex")
  const key = `${prefix}${ipHash}`
  const minute = new Date(now.getTime() - 60000)
  const requestedLimit = Number(process.env.DAILY_REQUEST_LIMIT)
  const dailyLimit = Number.isInteger(requestedLimit) && requestedLimit > 0 ? requestedLimit : 300

  return prisma.$transaction(async tx => {
    // Serialize chatbot reservations only; account/login limiters are independent.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(20261010, 1)`
    const daily = await tx.rateLimitHit.count({ where: { key: { startsWith: prefix } } })
    if (daily >= dailyLimit) return false
    const perIp = await tx.rateLimitHit.count({ where: { key, created_at: { gte: minute } } })
    if (perIp >= 12) return false
    // Une seule adresse ne peut pas épuiser le quota quotidien commun.
    const perIpDaily = await tx.rateLimitHit.count({ where: { key } })
    if (perIpDaily >= PER_IP_DAILY_LIMIT) return false
    const globalMinute = await tx.rateLimitHit.count({ where: { key: { startsWith: "chatbot:v1:" }, created_at: { gte: minute } } })
    if (globalMinute >= 30) return false
    await tx.rateLimitHit.create({ data: { key } })
    return true
  }, { maxWait: 5000, timeout: 10000 })
}
