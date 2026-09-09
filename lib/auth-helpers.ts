import type { Session } from "next-auth"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { NextResponse } from "next/server"

export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/login")
  }
  return session
}

export async function requireAdmin() {
  const session = await requireAuth()
  if (session.user.role !== "admin") {
    redirect("/dashboard")
  }
  return session
}

export async function getOptionalAuth() {
  return await auth()
}

type ApiAuthResult =
  | { ok: true; session: Session }
  | { ok: false; response: NextResponse }

/** Pour les routes API : session obligatoire, sinon 401. */
export async function requireApiUser(): Promise<ApiAuthResult> {
  const session = await auth()
  if (!session?.user) {
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
