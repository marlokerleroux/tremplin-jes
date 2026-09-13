import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiAdmin } from "@/lib/auth-helpers"
import { uploadPrivateFile } from "@/lib/blob-storage"
import { imageErrorMessage, readImageFile } from "@/lib/image"

/** Envoi d'une image du site vitrine (photo de finaliste, logo de partenaire). */
export async function POST(request: NextRequest) {
  const authResult = await requireApiAdmin()
  if (!authResult.ok) return authResult.response

  try {
    const formData = await request.formData()
    const file = await readImageFile(formData.get("file"))
    if (!file.ok) {
      return NextResponse.json({ error: imageErrorMessage(file.error) }, { status: 400 })
    }
    const extension = file.contentType === "image/png" ? "png" : file.contentType === "image/webp" ? "webp" : "jpg"
    const blobUrl = await uploadPrivateFile(`vitrine/${Date.now()}.${extension}`, file.buffer, file.contentType)
    const media = await prisma.vitrineMedia.create({ data: { blob_url: blobUrl, content_type: file.contentType, filename: file.name } })
    return NextResponse.json({ success: true, url: `/api/vitrine/media/${media.id}` })
  } catch (error) {
    console.error("Error uploading vitrine media:", error)
    return NextResponse.json({ error: "Erreur lors de l'envoi de l'image" }, { status: 500 })
  }
}
