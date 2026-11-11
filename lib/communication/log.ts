import { randomUUID } from "node:crypto"
import { communicationRpc } from "./store"
import { classifyTopic, redactContacts, responseStatus } from "./domain"
export async function recordQuestion(question: string, result: { answer: string; sources?: { title: string; url?: string }[]; answerStatus?: string } | null, conversationId?: string) {
  try {
    await communicationRpc("record", { id: randomUUID(), question: redactContacts(question).slice(0, 1500), answer: result ? redactContacts(result.answer).slice(0, 8000) : "", status: result ? responseStatus(result.answer, result.answerStatus) : "error", topic: classifyTopic(question), sources: (result?.sources || []).map(s => ({ title: s.title, ...(s.url?.startsWith("https://") ? { url: s.url } : {}) })), conversationId: conversationId || null })
  } catch { console.error("[communication] question recording unavailable") }
}
