import { buildRulesPdf, pdfResponse } from "@/lib/reglement/store"

// Règlement public (vitrine et espace candidat) : régénéré à chaque demande pour publier immédiatement les modifications.
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  try {
    const { bytes, filename } = await buildRulesPdf()
    return pdfResponse(bytes, filename, "public, no-cache")
  } catch (error) {
    console.error("Error generating rules PDF:", error)
    return new Response("Le règlement est momentanément indisponible. Merci de réessayer plus tard.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Retry-After": "60" },
    })
  }
}
