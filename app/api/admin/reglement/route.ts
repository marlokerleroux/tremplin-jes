import { NextResponse } from "next/server"
import { requireApiAdmin } from "@/lib/auth-helpers"
import { getSeasonConfig } from "@/lib/season-config"
import { getRules, resetRules, rulesVars, saveRules } from "@/lib/reglement/store"
import { DEFAULT_RULES_BODY, DEFAULT_RULES_TITLE, RULES_VARIABLES } from "@/lib/reglement/default"
import { rulesSchema } from "@/lib/validation/results"
import { formatZodError } from "@/lib/validation/common"

/** Règlement du tremplin : texte en vigueur, texte par défaut et valeurs actuelles des variables. */
export async function GET() {
  const authResult = await requireApiAdmin()
  if (!authResult.ok) return authResult.response

  try {
    const [rules, season] = await Promise.all([getRules(), getSeasonConfig()])
    const values = rulesVars(season)
    return NextResponse.json({
      rules,
      defaultTitle: DEFAULT_RULES_TITLE,
      defaultBody: DEFAULT_RULES_BODY,
      variables: Object.entries(RULES_VARIABLES).map(([key, label]) => ({ key, label, value: values[key as keyof typeof values] })),
    })
  } catch (error) {
    console.error("Error loading rules:", error)
    return NextResponse.json({ error: "Erreur lors de la récupération du règlement" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const authResult = await requireApiAdmin()
  if (!authResult.ok) return authResult.response

  try {
    const parsed = rulesSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }
    return NextResponse.json({ success: true, rules: await saveRules(parsed.data.title, parsed.data.body) })
  } catch (error) {
    console.error("Error saving rules:", error)
    return NextResponse.json({ error: "Erreur lors de l'enregistrement du règlement" }, { status: 500 })
  }
}

/** Revient au règlement par défaut. */
export async function DELETE() {
  const authResult = await requireApiAdmin()
  if (!authResult.ok) return authResult.response

  try {
    return NextResponse.json({ success: true, rules: await resetRules() })
  } catch (error) {
    console.error("Error resetting rules:", error)
    return NextResponse.json({ error: "Erreur lors de la réinitialisation du règlement" }, { status: 500 })
  }
}
