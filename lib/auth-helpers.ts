import type { Session } from "next-auth"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { NextResponse } from "next/server"

/**
 * Session vérifiée contre la base : le rôle du JWT est remplacé par le rôle courant du profil,
 * un compte supprimé n'est plus reconnu même si son jeton est encore valide, et un changement de mot de passe
 * (session_version incrémentée) invalide les sessions ouvertes auparavant.
 */
async function getVerifiedSession(): Promise<Session | null> {
  const session = await auth()
  if (!session?.user?.id) return null
  const profile = await prisma.profile.findUnique({ where: { id: session.user.id }, select: { role: true, session_version: true } })
  if (!profile || profile.session_version !== (session.user.sessionVersion ?? 0)) return null
  return { ...session, user: { ...session.user, role: profile.role } }
}

export async function requireAuth(): Promise<Session> {
  const session = await getVerifiedSession()
  if (!session) {
    redirect("/auth/login")
  }
  return session
}

export async function requireAdmin(): Promise<Session> {
  const session = await requireAuth()
  if (session.user.role !== "admin") {
    redirect("/dashboard")
  }
  return session
}

export async function getOptionalAuth() {
  return getVerifiedSession()
}

type ApiAuthResult = { ok: true; session: Session } | { ok: false; response: NextResponse }

/** Pour les routes API : session obligatoire, sinon 401. */
export async function requireApiUser(): Promise<ApiAuthResult> {
  const session = await getVerifiedSession()
  if (!session) {
    return { ok: false, response: NextResponse.json({ error: "Non authentifié" }, { status: 401 }) }
  }
  return { ok: true, session }
}

/** Pour les routes API d'administration : rôle admin obligatoire, sinon 401/403. */
export async function requireApiAdmin(): Promise<ApiAuthResult> {
  const result = await requireApiUser()
  if (!result.ok) return result
  if (result.session.user.role !== "admin") {
    return { ok: false, response: NextResponse.json({ error: "Accès refusé" }, { status: 403 }) }
  }
  return result
}
