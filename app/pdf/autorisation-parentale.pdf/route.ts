import { parentalAuthorizationContent } from "@/lib/autorisation-parentale/content"
import { renderRulesPdf } from "@/lib/reglement/pdf"
import { pdfResponse } from "@/lib/reglement/store"
import { seasonLabel } from "@/lib/reglement/markup"
import { getSeasonConfig } from "@/lib/season-config"

// Modèle d'autorisation parentale : régénéré à la demande pour afficher la date de référence de la saison en cours.
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  try {
    const season = await getSeasonConfig()
    const { title, body, filename } = parentalAuthorizationContent(season)
    const bytes = await renderRulesPdf({
      title,
      body,
      footer: `Tremplin Jeunes en Scène ${seasonLabel(season.edition)} — Association Pass'Musique`,
      subject: "Autorisation parentale — Tremplin Jeunes en Scène",
    })
    return pdfResponse(bytes, filename, "public, max-age=0, s-maxage=60, stale-while-revalidate=60")
  } catch (error) {
    console.error("Error generating parental authorization PDF:", error)
    return new Response("Le modèle est momentanément indisponible. Merci de réessayer plus tard.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Retry-After": "60" },
    })
  }
}
