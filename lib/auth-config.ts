import type { NextAuthConfig } from "next-auth"
import { CredentialsSignin } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { authConfigEdge } from "@/lib/auth-config.edge"
import { loginSchema } from "@/lib/validation/auth"
import { getClientIp, hitRateLimit, RATE_LIMITS } from "@/lib/rate-limit"

/** Trop de tentatives : remonté au client via `code` pour afficher un message dédié. */
export class RateLimitedSignin extends CredentialsSignin {
  code = "rate_limited"
}

// Hash factice comparé quand le compte n'existe pas, pour un temps de réponse uniforme.
const DUMMY_HASH = bcrypt.hashSync("mot-de-passe-factice", 12)

export const authConfig: NextAuthConfig = {
  ...authConfigEdge,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null
        const { email, password } = parsed.data
        const ip = getClientIp(request)

        const [byPair, byIp] = await Promise.all([
          hitRateLimit(`login:${email}:${ip}`, RATE_LIMITS.login.limit, RATE_LIMITS.login.windowMs, { failClosed: true }),
          hitRateLimit(`login-ip:${ip}`, RATE_LIMITS.loginPerIp.limit, RATE_LIMITS.loginPerIp.windowMs, { failClosed: true }),
        ])
        if (byPair.limited || byIp.limited) {
          console.warn("[auth] login rate limited", { email, ip })
          throw new RateLimitedSignin()
        }

        // Recherche insensible à la casse : les comptes historiques peuvent contenir des majuscules.
        const profile = await prisma.profile.findFirst({ where: { email: { equals: email, mode: "insensitive" } } })
        const isValid = await bcrypt.compare(password, profile?.password_hash ?? DUMMY_HASH)
        if (!profile || !isValid) return null

        return {
          id: profile.id,
          email: profile.email,
          name: `${profile.first_name} ${profile.last_name}`,
          role: profile.role,
          firstName: profile.first_name,
          lastName: profile.last_name,
          sessionVersion: profile.session_version,
        }
      },
    }),
  ],
}
