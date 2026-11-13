import { answer, validateMessages } from "../../chatbot/server/rag-core.mjs"
import { MAX_AUDIO_BYTES, validateAudio, transcribe } from "../../chatbot/server/audio.mjs"
import { readKnowledge } from "./knowledge"
import { reserveChatbotRequest } from "./quota"
import { BodyTooLarge, json, readBody, sameOrigin } from "./http"
import { recordQuestion } from "@/lib/communication/log"
import { validUuid } from "@/lib/communication/domain"

export async function handleGet(endpoint: string) {
  if (!["health", "sources"].includes(endpoint)) return json({ error: "Ressource introuvable." }, 404)
  try {
    const { stats } = await readKnowledge()
    const configured = Boolean(process.env.OPENROUTER_API_KEY)
    return endpoint === "sources" ? json(stats) : json({ ok: configured, configured, ...stats }, configured ? 200 : 503)
  } catch {
    return json({ ok: false, error: "La documentation est temporairement indisponible." }, 503)
  }
}

export async function handlePost(request: Request, endpoint: string) {
  if (!["chat", "transcribe"].includes(endpoint)) return json({ error: "Ressource introuvable." }, 404)
  if (!sameOrigin(request)) return json({ error: "Origine non autorisée." }, 403)
  let messages, audio
  let conversationId: string | undefined
  try {
    if (endpoint === "transcribe") {
      audio = validateAudio(await readBody(request, MAX_AUDIO_BYTES), request.headers.get("content-type") || "")
    } else {
      if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return json({ error: "Format de demande non reconnu." }, 415)
      const body = JSON.parse((await readBody(request, 24 * 1024)).toString("utf8"))
      messages = validateMessages(body?.messages)
      conversationId = validUuid(body?.conversationId) ? body.conversationId : undefined
    }
  } catch (error) {
    return json({ error: endpoint === "transcribe" ? "Le vocal est illisible ou dépasse 2 Mo. Enregistre une question plus courte." : "Écris une question de 1 500 caractères maximum." }, error instanceof BodyTooLarge ? 413 : 400)
  }
  if (!process.env.OPENROUTER_API_KEY) return json({ error: "L’assistant est en cours de connexion. Réessaie un peu plus tard." }, 503)
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(50000)])
  try {
    if (!await reserveChatbotRequest(request)) return json({ error: "L’assistant a atteint sa limite de demandes. Réessaie plus tard ; les informations restent disponibles sur le site." }, 429, { "Retry-After": "60" })
    if (audio) {
      const result = await transcribe(audio, signal)
      return json(result.error ? { error: result.error } : { text: result.text }, result.status || 200)
    }
    if (!messages) throw new Error("MISSING_MESSAGES")
    const result = await answer(messages, signal, (terms: string[]) => readKnowledge(terms, signal))
    await recordQuestion(messages.at(-1)!.content, result, conversationId)
    return json(result)
  } catch {
    if (messages) await recordQuestion(messages.at(-1)!.content, null, conversationId)
    return json({ error: "La connexion à l’assistant a été interrompue. Réessaie dans un instant." }, 503)
  }
}
