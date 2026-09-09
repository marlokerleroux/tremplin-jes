import type { NextAuthConfig } from "next-auth"
import { NextResponse } from "next/server"

/**
 * Configuration NextAuth compatible Edge (middleware) : pas de Prisma ni de bcrypt.
 * Contient les callbacks de session et la protection des pages privées.
 */

const PROTECTED_PREFIXES = ["/dashboard", "/apply", "/technical-sheet", "/parental-authorization", "/admin"]

export const authConfigEdge: NextAuthConfig = {
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl
      const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
      if (!isProtected) return true
      if (!auth?.user) return false // redirige vers pages.signIn
      if (pathname.startsWith("/admin") && auth.user.role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", request.nextUrl))
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? ""
        token.role = user.role ?? "user"
        token.firstName = user.firstName ?? ""
        token.lastName = user.lastName ?? ""
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.firstName = token.firstName
        session.user.lastName = token.lastName
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 jours
  },
}
