import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { prisma } from "../lib/prisma.ts"
import { reserveChatbotRequest } from "../lib/chatbot/quota.ts"

// Explicitly isolated local fixture; never run quota mutations against production.
const target = new URL(process.env.DATABASE_URL || "postgresql://invalid")
assert.equal(target.hostname, "127.0.0.1")
assert.equal(target.port, "54330")
assert.equal(target.pathname, "/tremplin_local")
const marker = `chatbot-quota-test:${randomUUID()}`
const request = new Request("http://localhost/api/chatbot/chat", { headers: { "x-forwarded-for": marker } })
process.env.AUTH_SECRET = marker
process.env.DAILY_REQUEST_LIMIT = "3"
const prefix = `chatbot:v1:${new Date().toISOString().slice(0, 10)}:`
assert.equal(await prisma.rateLimitHit.count({ where: { key: { startsWith: prefix } } }), 0, "Use a fresh local fixture before running this test")
const sentinel = await prisma.rateLimitHit.create({ data: { key: marker } })
try {
  const daily = await Promise.all(Array.from({ length: 20 }, () => reserveChatbotRequest(request)))
  assert.equal(daily.filter(Boolean).length, 3, "Concurrent Vercel instances must not exceed the shared daily limit")
  assert.equal(await prisma.rateLimitHit.count({ where: { key: { startsWith: prefix } } }), 3)
  assert.ok(await prisma.rateLimitHit.findUnique({ where: { id: sentinel.id } }), "Existing login limits stay untouched")
  await prisma.rateLimitHit.deleteMany({ where: { key: { startsWith: prefix } } })
  process.env.DAILY_REQUEST_LIMIT = "300"
  const minute = await Promise.all(Array.from({ length: 18 }, () => reserveChatbotRequest(request)))
  assert.equal(minute.filter(Boolean).length, 12, "Per-client quota must also hold under concurrent requests")
  const rows = await prisma.rateLimitHit.findMany({ where: { key: { startsWith: prefix } } })
  assert.ok(rows.every(row => !row.key.includes(marker)), "Raw client identity is not stored")
  console.log("Quota integration: daily 3/20, per-client 12/18, existing records preserved, client identities hashed.")
} finally {
  await prisma.rateLimitHit.deleteMany({ where: { key: { startsWith: prefix } } })
  await prisma.rateLimitHit.delete({ where: { id: sentinel.id } })
  await prisma.$disconnect()
}
