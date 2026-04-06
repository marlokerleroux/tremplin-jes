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
    const memberIndex = Number.parseInt(formData.get("memberIndex") as string)
    const memberName = formData.get("memberName") as string

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

    const filename = `parental-authorization-${applicationId}-member-${memberIndex}-${Date.now()}.pdf`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const blobUrl = await uploadBlob(filename, buffer, file.type)

    // Upsert parental authorization
    const existingAuth = await prisma.parentalAuthorization.findUnique({
      where: {
        application_id_member_index: {
          application_id: applicationId,
          member_index: memberIndex,
        },
      },
    })

    if (existingAuth) {
      console.log("[api] Updating existing parental auth:", existingAuth.id)
      await prisma.parentalAuthorization.update({
        where: { id: existingAuth.id },
        data: {
          pdf_url: blobUrl,
          member_name: memberName,
        },
      })
    } else {
      console.log("[api] Creating new parental auth for application:", applicationId, "member:", memberIndex)
      await prisma.parentalAuthorization.create({
        data: {
          application_id: applicationId,
          member_index: memberIndex,
          member_name: memberName,
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
    console.error("Error uploading parental authorization:", error)
    return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 })
  }
}
