import { NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { runReminders } from "@/lib/reminders-runner"
import { runDossierReminders } from "@/lib/dossier-reminders-runner"

export const dynamic = "force-dynamic"
export const maxDuration = 60

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const header = request.headers.get("authorization") ?? ""
  const expected = `Bearer ${secret}`
  if (header.length !== expected.length) return false
  return crypto.timingSafeEqual(new TextEncoder().encode(header), new TextEncoder().encode(expected))
}

/**
 * Tâche planifiée quotidienne (Vercel Cron, voir vercel.json) : rappels J-7 / J-1, relances des dossiers incomplets et
 * ménage des anciens compteurs de limitation de débit. L'appel quotidien maintient
 * aussi la base Supabase active (elle se met en pause après une semaine sans requête).
 */
export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) {
    console.error("[cron] CRON_SECRET is not configured")
    return NextResponse.json({ error: "CRON_SECRET non configuré" }, { status: 503 })
  }
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const [cleanup, reminders, dossierReminders] = await Promise.all([
      prisma.rateLimitHit.deleteMany({ where: { created_at: { lt: dayAgo } } }),
      runReminders(),
      runDossierReminders(),
    ])
    console.info("[cron] reminders run", { ...reminders, dossierReminders, rateLimitCleanup: cleanup.count })
    return NextResponse.json({ success: true, reminders, dossierReminders, rateLimitCleanup: cleanup.count })
  } catch (error) {
    console.error("[cron] reminders failed:", error)
    return NextResponse.json({ error: "Erreur lors de l'exécution de la tâche planifiée" }, { status: 500 })
  }
}
