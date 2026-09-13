import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiAdmin } from "@/lib/auth-helpers"
import { listTemplates } from "@/lib/email/template-store"
import { EDITABLE_TEMPLATES, TEMPLATE_VARIABLES } from "@/lib/email/editable-templates"
import { emailTemplateSchema, templateKeyOnlySchema } from "@/lib/validation/results"
import { formatZodError } from "@/lib/validation/common"

/** Modèles d'emails : définitions (libellés, variables, texte par défaut) et versions personnalisées. */
export async function GET() {
  const authResult = await requireApiAdmin()
  if (!authResult.ok) return authResult.response

  try {
    const templates = await listTemplates()
    return NextResponse.json({
      variables: TEMPLATE_VARIABLES,
      templates: templates.map((t) => ({
        ...t,
        label: EDITABLE_TEMPLATES[t.key].label,
        description: EDITABLE_TEMPLATES[t.key].description,
        variables: EDITABLE_TEMPLATES[t.key].variables,
        defaultSubject: EDITABLE_TEMPLATES[t.key].subject,
        defaultBody: EDITABLE_TEMPLATES[t.key].body,
      })),
    })
  } catch (error) {
    console.error("Error listing email templates:", error)
    return NextResponse.json({ error: "Erreur lors de la récupération des modèles" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const authResult = await requireApiAdmin()
  if (!authResult.ok) return authResult.response

  try {
    const parsed = emailTemplateSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }
    const { key, subject, body } = parsed.data
    const saved = await prisma.emailTemplate.upsert({
      where: { key },
      create: { key, subject, body },
      update: { subject, body },
    })
    return NextResponse.json({ success: true, template: { key, subject: saved.subject, body: saved.body, isCustomized: true, updated_at: saved.updated_at.toISOString() } })
  } catch (error) {
    console.error("Error saving email template:", error)
    return NextResponse.json({ error: "Erreur lors de l'enregistrement du modèle" }, { status: 500 })
  }
}

/** Réinitialise un modèle au texte par défaut. */
export async function DELETE(request: Request) {
  const authResult = await requireApiAdmin()
  if (!authResult.ok) return authResult.response

  try {
    const parsed = templateKeyOnlySchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }
    await prisma.emailTemplate.deleteMany({ where: { key: parsed.data.key } })
    const definition = EDITABLE_TEMPLATES[parsed.data.key]
    return NextResponse.json({ success: true, template: { key: parsed.data.key, subject: definition.subject, body: definition.body, isCustomized: false, updated_at: null } })
  } catch (error) {
    console.error("Error resetting email template:", error)
    return NextResponse.json({ error: "Erreur lors de la réinitialisation du modèle" }, { status: 500 })
  }
}
