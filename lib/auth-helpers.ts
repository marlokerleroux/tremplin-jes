import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

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
