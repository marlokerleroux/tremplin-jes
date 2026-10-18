import { prisma } from "@/lib/prisma"

export interface KnowledgeIndex {
  chunks: { id: string; url: string; title: string; text: string; embedding: string | null }[]
  lexical: { id: string }[]
  embeddingModel: string
  indexedAt: string
  stats: { documents: number; chunks: number; embeddings: number; indexedAt: string; source: string; storage: string }
}

const cache = new Map<string, { expires: number; index: KnowledgeIndex }>()

/** Read the existing private RAG through its server-only RPC; never expose chunks. */
export async function readKnowledge(terms: string[] = [], signal?: AbortSignal): Promise<KnowledgeIndex> {
  const query = terms.filter(term => /^[a-z0-9]+$/.test(term)).slice(0, 28).map(term => `${term}:*`).join(" | ")
  const cached = cache.get(query)
  if (cached && cached.expires > Date.now()) return cached.index
  let index: KnowledgeIndex
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const url = new URL(process.env.SUPABASE_URL)
    if (url.protocol !== "https:" || !url.hostname.endsWith(".supabase.co")) throw new Error("INVALID_SUPABASE_URL")
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    const response = await fetch(`${url.origin}/rest/v1/rpc/tremplin_chatbot_read_index`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query_terms: query }), cache: "no-store",
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000),
    })
    if (!response.ok) { await response.body?.cancel(); throw new Error("KNOWLEDGE_UNAVAILABLE") }
    index = await response.json()
  } else {
    const rows = await prisma.$queryRaw<{ value: KnowledgeIndex }[]>`
      SELECT public.tremplin_chatbot_read_index(${query}::text) AS value
    `
    index = rows[0]?.value
  }
  if (!index?.chunks?.length || !index.stats || !Array.isArray(index.lexical)) throw new Error("EMPTY_KNOWLEDGE")
  if (cache.size >= 30) cache.clear()
  cache.set(query, { expires: Date.now() + 60000, index })
  return index
}
