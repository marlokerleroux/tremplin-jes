import { prisma } from "@/lib/prisma"

export async function communicationRpc<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const url = new URL(process.env.SUPABASE_URL)
    if (url.protocol !== "https:" || !url.hostname.endsWith(".supabase.co")) throw new Error("INVALID_SUPABASE_URL")
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    const response = await fetch(`${url.origin}/rest/v1/rpc/tremplin_communication`, {
      method: "POST", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ operation: action, payload }), cache: "no-store", signal: AbortSignal.timeout(action === "record" || action === "manuals" ? 3000 : 15000),
    })
    if (!response.ok) { await response.body?.cancel(); throw new Error("COMMUNICATION_STORE_UNAVAILABLE") }
    return response.json()
  }
  const rows = await prisma.$queryRaw<{ value: T }[]>`SELECT public.tremplin_communication(${action}::text, ${JSON.stringify(payload)}::jsonb) AS value`
  if (!rows.length) throw new Error("COMMUNICATION_STORE_UNAVAILABLE")
  return rows[0].value
}
