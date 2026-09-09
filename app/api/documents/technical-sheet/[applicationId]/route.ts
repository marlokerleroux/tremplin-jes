import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiUser } from "@/lib/auth-helpers"
import { streamPdf } from "@/lib/document-response"
import { uuidSchema } from "@/lib/validation/common"

export async function GET(request: Request, context: { params: Promise<{ applicationId: string }> }) {
  const authResult = await requireApiUser()
  if (!authResult.ok) return authResult.response
  const { session } = authResult

  const { applicationId } = await context.params
  const parsed = uuidSchema.safeParse(applicationId)
  if (!parsed.success) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 })
  }

  const application = await prisma.application.findUnique({
    where: { id: parsed.data },
    select: { user_id: true, stage_name: true, technical_sheet: { select: { pdf_url: true } } },
  })
  if (!application || (application.user_id !== session.user.id && session.user.role !== "admin")) {
    return NextResponse.json({ error: "Document introuvable" }, { status: 404 })
  }
  if (!application.technical_sheet?.pdf_url) {
    return NextResponse.json({ error: "Aucune fiche technique" }, { status: 404 })
  }

  return streamPdf(application.technical_sheet.pdf_url, `fiche-technique-${application.stage_name}.pdf`, request)
}
