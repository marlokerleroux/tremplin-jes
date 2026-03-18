import type { NextAuthConfig } from "next-auth"

/**
 * Lightweight auth config for Edge middleware.
 * Does NOT include the Credentials provider (which needs Prisma + bcrypt).
 * Only handles JWT session callbacks and page config.
 */
export const authConfigEdge: NextAuthConfig = {
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.firstName = (user as any).firstName
        token.lastName = (user as any).lastName
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.firstName = token.firstName as string
        session.user.lastName = token.lastName as string
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
  },
}
