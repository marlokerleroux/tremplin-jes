import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth-config"

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

export async function handleSignOut() {
  "use server"
  const { signOut: nextAuthSignOut } = await import("@/lib/auth")
  await nextAuthSignOut({ redirectTo: "/auth/login" })
}
