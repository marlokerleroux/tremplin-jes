import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiUser } from "@/lib/auth-helpers"
import { deleteBlob, uploadPrivatePdf } from "@/lib/blob-storage"
import { pdfErrorMessage, readPdfFile } from "@/lib/pdf"
import { sendTechnicalSheetSubmittedEmail } from "@/lib/email/notifications"
import { uuidSchema } from "@/lib/validation/common"
import { notifyAdminsIfComplete } from "@/lib/dossier"

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireApiUser()
    if (!authResult.ok) return authResult.response
    const { session } = authResult

    const formData = await request.formData()
    const applicationId = uuidSchema.safeParse(formData.get("applicationId"))
    if (!applicationId.success) {
      return NextResponse.json({ error: "ID de candidature manquant" }, { status: 400 })
    }

    const application = await prisma.application.findFirst({
      where: { id: applicationId.data, user_id: session.user.id },
      include: { technical_sheet: { select: { pdf_url: true } }, profile: { select: { email: true, first_name: true, last_name: true } } },
    })
    if (!application) {
      return NextResponse.json({ error: "Candidature non trouvée" }, { status: 404 })
    }
    if (application.status === "validated") {
      return NextResponse.json({ error: "Candidature validée : la fiche technique ne peut plus être modifiée" }, { status: 403 })
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

    await sendTechnicalSheetSubmittedEmail(application.profile.email, application.profile.first_name, application.profile.last_name)
    await notifyAdminsIfComplete(application)

    return NextResponse.json({ success: true, filename: file.name, size: file.size })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Erreur lors de l'envoi du fichier" }, { status: 500 })
  }
}
