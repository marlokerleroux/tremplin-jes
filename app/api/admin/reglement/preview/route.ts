import { NextResponse } from "next/server"
import { requireApiAdmin } from "@/lib/auth-helpers"
import { buildRulesPdf, pdfResponse } from "@/lib/reglement/store"
import { rulesSchema } from "@/lib/validation/results"
import { formatZodError } from "@/lib/validation/common"

/** Aperçu PDF du règlement en cours d'édition (non enregistré). */
export async function POST(request: Request) {
  const authResult = await requireApiAdmin()
  if (!authResult.ok) return authResult.response

  try {
    const parsed = rulesSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }
    const { bytes, filename } = await buildRulesPdf(parsed.data)
    return pdfResponse(bytes, `apercu-${filename}`, "private, no-store")
  } catch (error) {
    console.error("Error previewing rules:", error)
    return NextResponse.json({ error: "Erreur lors de la génération de l'aperçu" }, { status: 500 })
  }
}
