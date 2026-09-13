import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiAdmin } from "@/lib/auth-helpers"
import { renderStoredTemplate } from "@/lib/email/template-store"
import { PREVIEW_VARIABLES } from "@/lib/email/editable-templates"
import { getSMTPConfig } from "@/lib/email/notifications"
import { sendEmail } from "@/lib/email/mailer"
import { emailTemplateSchema } from "@/lib/validation/results"
import { formatZodError } from "@/lib/validation/common"

/** Envoie le modèle (tel que saisi, non enregistré) à l'adresse de l'administrateur connecté. */
export async function POST(request: Request) {
  const authResult = await requireApiAdmin()
  if (!authResult.ok) return authResult.response

  try {
    const parsed = emailTemplateSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }
    const smtp = await getSMTPConfig()
    if (!smtp) {
      return NextResponse.json({ error: "Configuration SMTP absente" }, { status: 400 })
    }
    const admin = await prisma.profile.findUnique({ where: { id: authResult.session.user.id }, select: { email: true } })
    if (!admin) return NextResponse.json({ error: "Compte introuvable" }, { status: 404 })

    const email = renderStoredTemplate(parsed.data, PREVIEW_VARIABLES)
    const result = await sendEmail(admin.email, { ...email, subject: `[Test] ${email.subject}` }, smtp)
    if (!result.success) {
      return NextResponse.json({ error: `Envoi impossible : ${result.error ?? "erreur SMTP"}` }, { status: 500 })
    }
    return NextResponse.json({ success: true, message: `Email de test envoyé à ${admin.email}` })
  } catch (error) {
    console.error("Error sending template test:", error)
    return NextResponse.json({ error: "Erreur lors de l'envoi du test" }, { status: 500 })
  }
}
