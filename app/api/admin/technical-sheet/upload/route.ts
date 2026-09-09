import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiAdmin } from "@/lib/auth-helpers"
import { deleteBlob, uploadPrivatePdf } from "@/lib/blob-storage"
import { pdfErrorMessage, readPdfFile } from "@/lib/pdf"
import { uuidSchema } from "@/lib/validation/common"

export async function POST(request: NextRequest) {
  const authResult = await requireApiAdmin()
  if (!authResult.ok) return authResult.response

  try {
    const formData = await request.formData()
    const applicationId = uuidSchema.safeParse(formData.get("applicationId"))
    if (!applicationId.success) {
      return NextResponse.json({ error: "ID de candidature manquant" }, { status: 400 })
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId.data },
      include: { technical_sheet: { select: { pdf_url: true } } },
    })
    if (!application) {
      return NextResponse.json({ error: "Candidature non trouvée" }, { status: 404 })
    }

    const file = await readPdfFile(formData.get("file"))
    if (!file.ok) {
      return NextResponse.json({ error: pdfErrorMessage(file.error) }, { status: 400 })
    }

    const blobUrl = await uploadPrivatePdf(`technical-sheets/${application.edition}/${application.id}.pdf`, file.buffer)
    const previousUrl = application.technical_sheet?.pdf_url

    await prisma.technicalSheet.upsert({
      where: { application_id: application.id },
      create: { application_id: application.id, pdf_url: blobUrl },
      update: { pdf_url: blobUrl },
    })

    if (previousUrl && previousUrl !== blobUrl) {
      await deleteBlob(previousUrl)
    }

    return NextResponse.json({ success: true, filename: file.name, size: file.size })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Erreur lors de l'envoi du fichier" }, { status: 500 })
  }
}
