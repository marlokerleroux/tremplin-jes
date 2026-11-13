import { beforeEach, afterEach, describe, it, expect, vi } from "vitest"
import { scryptSync } from "node:crypto"
import { passwordMatches, issueSession, verifySession, sessionCookie, loginKey, SESSION_SECONDS } from "./session"
import { redactContacts, safeCsv, responseStatus } from "./domain"
const salt = "a".repeat(32)
const hash = `scrypt:${salt}:${scryptSync("test-password",salt,32).toString("hex")}`
beforeEach(()=>vi.stubEnv("AUTH_SECRET","test-secret-for-session-only"))
afterEach(()=>vi.unstubAllEnvs())
describe("communication access",()=>{
  it("checks a scrypt hash and rejects invalid encodings",()=>{
    expect(passwordMatches("test-password",hash)).toBe(true)
    expect(passwordMatches("wrong",hash)).toBe(false)
    expect(passwordMatches("test-password","broken")).toBe(false)
  })
  it("rejects tampered, expired and rotated sessions",()=>{
    const now=Date.now(),token=issueSession(hash,now)
    expect(verifySession(token,hash,now+1000)).toBe(true)
    expect(verifySession(token+"a",hash,now)).toBe(false)
    expect(verifySession(token,hash,now+SESSION_SECONDS*1000)).toBe(false)
    expect(verifySession(token,hash+"rotated",now)).toBe(false)
    expect(verifySession(undefined,hash)).toBe(false)
  })
  it("uses private same-site HTTPS cookies and hashes login addresses",()=>{
    expect(sessionCookie("token",true)).toContain("HttpOnly; SameSite=Strict")
    expect(sessionCookie("token",true)).toContain("; Secure")
    expect(sessionCookie("",true)).toContain("Max-Age=0")
    const key=loginKey(new Request("https://example.com",{headers:{"x-forwarded-for":"192.0.2.2"}}))
    expect(key).toMatch(/^[a-f0-9]{64}$/)
    expect(key).not.toContain("192.0")
  })
})
describe("stored visitor content",()=>{
  it("masks detected contact details without inventing complete anonymization",()=>{
    expect(redactContacts("Écris à lucas@example.com ou au 06 12 34 56 78.")).toBe("Écris à [adresse e-mail masquée] ou au [téléphone masqué].")
    expect(redactContacts("+33 6 12 34 56 78")).toBe("[téléphone masqué]")
  })
  it("keeps missing information visible and exports spreadsheet-safe text",()=>{
    expect(responseStatus("Il faut demander à l’équipe.","missing_information")).toBe("unanswered")
    expect(responseStatus("Je ne peux pas confirmer cette date.")).toBe("unanswered")
    expect(safeCsv('=HYPERLINK("secret")')).toBe('"\'=HYPERLINK(""secret"")"')
    expect(safeCsv("  +formula")).toBe('"\'  +formula"')
  })
})
