import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiAdmin } from "@/lib/auth-helpers"
import { deleteBlob, uploadPrivatePdf } from "@/lib/blob-storage"
import { pdfErrorMessage, readPdfFile } from "@/lib/pdf"
import { normalizeGroupMembers } from "@/lib/admin-data"
import { uuidSchema } from "@/lib/validation/common"

export async function POST(request: NextRequest) {
  const authResult = await requireApiAdmin()
  if (!authResult.ok) return authResult.response

  try {
    const formData = await request.formData()
    const applicationId = uuidSchema.safeParse(formData.get("applicationId"))
    const memberIndex = Number.parseInt(String(formData.get("memberIndex") ?? ""), 10)
    if (!applicationId.success) {
      return NextResponse.json({ error: "ID de candidature manquant" }, { status: 400 })
    }
    if (!Number.isInteger(memberIndex) || memberIndex < 0) {
      return NextResponse.json({ error: "Membre invalide" }, { status: 400 })
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId.data },
      include: { parental_authorizations: { where: { member_index: memberIndex }, select: { pdf_url: true } } },
    })
    if (!application) {
      return NextResponse.json({ error: "Candidature non trouvée" }, { status: 404 })
    }
    const members = normalizeGroupMembers(application.group_members)
    if (memberIndex >= members.length) {
      return NextResponse.json({ error: "Membre inconnu" }, { status: 400 })
    }
    const member = members[memberIndex]
    const memberName = `${member.firstName} ${member.lastName}`.trim() || null

    const file = await readPdfFile(formData.get("file"))
    if (!file.ok) {
      return NextResponse.json({ error: pdfErrorMessage(file.error) }, { status: 400 })
    }

    const blobUrl = await uploadPrivatePdf(
      `parental-authorizations/${application.edition}/${application.id}-${memberIndex}.pdf`,
      file.buffer,
    )
    const previousUrl = application.parental_authorizations[0]?.pdf_url

    await prisma.parentalAuthorization.upsert({
      where: { application_id_member_index: { application_id: application.id, member_index: memberIndex } },
      create: { application_id: application.id, member_index: memberIndex, member_name: memberName, pdf_url: blobUrl },
      update: { pdf_url: blobUrl, member_name: memberName },
    })

    if (previousUrl && previousUrl !== blobUrl) {
      await deleteBlob(previousUrl)
    }

    return NextResponse.json({ success: true, filename: file.name, size: file.size })
  } catch (error) {
    console.error("Error uploading parental authorization:", error)
    return NextResponse.json({ error: "Erreur lors de l'envoi du fichier" }, { status: 500 })
  }
}
