import { NextResponse } from "next/server"
import { requireApiAdmin } from "@/lib/auth-helpers"
import { renderStoredTemplate } from "@/lib/email/template-store"
import { PREVIEW_VARIABLES } from "@/lib/email/editable-templates"
import { emailTemplateSchema } from "@/lib/validation/results"
import { formatZodError } from "@/lib/validation/common"

/** Aperçu d'un modèle (non enregistré) avec des données d'exemple. */
export async function POST(request: Request) {
  const authResult = await requireApiAdmin()
  if (!authResult.ok) return authResult.response

  const parsed = emailTemplateSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
  }
  const rendered = renderStoredTemplate(parsed.data, PREVIEW_VARIABLES)
  return NextResponse.json({ subject: rendered.subject, text: rendered.text, html: rendered.html })
}
