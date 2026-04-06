import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { uploadBlob } from "@/lib/blob-storage"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé - accès administrateur requis" }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const applicationId = formData.get("applicationId") as string

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 })
    }

    if (!applicationId) {
      return NextResponse.json({ error: "ID de candidature manquant" }, { status: 400 })
    }

    // Verify file is a PDF
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Seuls les fichiers PDF sont acceptés" }, { status: 400 })
    }

    // Verify file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Le fichier ne doit pas dépasser 10 MB" }, { status: 400 })
    }

    // Verify the application exists
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    })

    if (!application) {
      return NextResponse.json({ error: "Candidature non trouvée" }, { status: 404 })
    }

    // Upload to Azure Blob with a unique filename
    const filename = `technical-sheet-${applicationId}-${Date.now()}.pdf`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const blobUrl = await uploadBlob(filename, buffer, file.type)

    // Upsert the technical sheet record
    const existingSheet = await prisma.technicalSheet.findFirst({
      where: { application_id: applicationId },
    })

    if (existingSheet) {
      console.log("[api] Updating existing technical sheet:", existingSheet.id)
      await prisma.technicalSheet.update({
        where: { id: existingSheet.id },
        data: { pdf_url: blobUrl },
      })
    } else {
      console.log("[api] Creating new technical sheet for application:", applicationId)
      await prisma.technicalSheet.create({
        data: {
          application_id: applicationId,
          pdf_url: blobUrl,
        },
      })
    }

    return NextResponse.json({
      url: blobUrl,
      filename: file.name,
      size: file.size,
      success: true,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 })
  }
}
