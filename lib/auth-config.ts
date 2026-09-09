import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { authConfigEdge } from "@/lib/auth-config.edge"
import { loginSchema } from "@/lib/validation/auth"
import { hitRateLimit, RATE_LIMITS } from "@/lib/rate-limit"

export const authConfig: NextAuthConfig = {
  ...authConfigEdge,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null
        const { email, password } = parsed.data

        const { limited } = await hitRateLimit(`login:${email}`, RATE_LIMITS.login.limit, RATE_LIMITS.login.windowMs)
        if (limited) {
          console.warn("[auth] login rate limited for", email)
          return null
        }

        const profile = await prisma.profile.findUnique({ where: { email } })
        if (!profile) return null

        const isValid = await bcrypt.compare(password, profile.password_hash)
        if (!isValid) return null

        return {
          id: profile.id,
          email: profile.email,
          name: `${profile.first_name} ${profile.last_name}`,
          role: profile.role,
          firstName: profile.first_name,
          lastName: profile.last_name,
        }
      },
    }),
  ],
}
