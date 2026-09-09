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
  const memberIndex = Number.parseInt(new URL(request.url).searchParams.get("member") ?? "0", 10)
  if (!parsed.success || !Number.isInteger(memberIndex) || memberIndex < 0) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 })
  }

  const application = await prisma.application.findUnique({
    where: { id: parsed.data },
    select: {
      user_id: true,
      stage_name: true,
      parental_authorizations: { where: { member_index: memberIndex }, select: { pdf_url: true, member_name: true } },
    },
  })
  if (!application || (application.user_id !== session.user.id && session.user.role !== "admin")) {
    return NextResponse.json({ error: "Document introuvable" }, { status: 404 })
  }
  const authorization = application.parental_authorizations[0]
  if (!authorization) {
    return NextResponse.json({ error: "Aucune autorisation parentale" }, { status: 404 })
  }

  const label = authorization.member_name || application.stage_name
  return streamPdf(authorization.pdf_url, `autorisation-parentale-${label}.pdf`, request)
}
