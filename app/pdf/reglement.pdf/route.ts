import { buildRulesPdf, pdfResponse } from "@/lib/reglement/store"

// Règlement public (vitrine et espace candidat) : régénéré à la demande, mis en cache 1 minute par le CDN
// (une modification est visible au plus tard une minute après son enregistrement).
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  try {
    const { bytes, filename } = await buildRulesPdf()
    return pdfResponse(bytes, filename, "public, max-age=0, s-maxage=60, stale-while-revalidate=60")
  } catch (error) {
    console.error("Error generating rules PDF:", error)
    return new Response("Le règlement est momentanément indisponible. Merci de réessayer plus tard.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Retry-After": "60" },
    })
  }
}
