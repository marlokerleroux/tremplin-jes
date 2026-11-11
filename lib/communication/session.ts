import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto"
export const ADMIN_COOKIE = "tremplin_communication_session"
export const SESSION_SECONDS = 8 * 60 * 60
export function passwordMatches(password: string, encoded: string): boolean {
  const [scheme, salt, hash] = encoded.split(":")
  if (scheme !== "scrypt" || !/^[a-f0-9]{32}$/.test(salt || "") || !/^[a-f0-9]{64}$/.test(hash || "") || password.length > 200) return false
  const expected = Buffer.from(hash, "hex"), actual = scryptSync(password, salt, 32)
  return timingSafeEqual(new Uint8Array(expected), new Uint8Array(actual))
}
function signingKey(passwordHash: string): string {
  const secret = process.env.CHATBOT_ADMIN_SESSION_SECRET || process.env.AUTH_SECRET || process.env.OPENROUTER_API_KEY
  if (!secret) throw new Error("MISSING_ADMIN_SESSION_SECRET")
  return createHmac("sha256", secret).update(`communication:v1:${passwordHash}`).digest("hex")
}
export function issueSession(passwordHash: string, now = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(now / 1000) + SESSION_SECONDS, nonce: randomBytes(16).toString("hex") })).toString("base64url")
  return `${payload}.${createHmac("sha256", signingKey(passwordHash)).update(payload).digest("base64url")}`
}
export function verifySession(token: string | undefined, passwordHash: string, now = Date.now()): boolean {
  if (!token || token.length > 500) return false
  try {
    const parts = token.split("."); if (parts.length !== 2) return false
    const [payload, signature] = parts, expected = createHmac("sha256", signingKey(passwordHash)).update(payload).digest()
    const actual = Buffer.from(signature, "base64url")
    if (expected.length !== actual.length || !timingSafeEqual(new Uint8Array(expected), new Uint8Array(actual))) return false
    const { exp, nonce } = JSON.parse(Buffer.from(payload, "base64url").toString())
    return Number.isInteger(exp) && exp > now / 1000 && exp <= now / 1000 + SESSION_SECONDS && typeof nonce === "string"
  } catch { return false }
}
export function cookieToken(request: Request): string | undefined {
  return request.headers.get("cookie")?.split(";").map(x => x.trim()).find(x => x.startsWith(ADMIN_COOKIE + "="))?.slice(ADMIN_COOKIE.length + 1)
}
export function sessionCookie(token: string, secure: boolean): string {
  return `${ADMIN_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${token ? SESSION_SECONDS : 0}${secure ? "; Secure" : ""}`
}
export function loginKey(request: Request): string {
  const secret = process.env.CHATBOT_ADMIN_SESSION_SECRET || process.env.AUTH_SECRET || process.env.OPENROUTER_API_KEY
  if (!secret) throw new Error("MISSING_ADMIN_SESSION_SECRET")
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown"
  return createHmac("sha256", secret).update(`communication-login:${ip}`).digest("hex")
}
