import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { readBlob } from "@/lib/blob-storage"
import { uuidSchema } from "@/lib/validation/common"

/** Image publique du site vitrine (servie depuis le store privé, cache long : chaque envoi crée un nouvel identifiant). */
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  if (!uuidSchema.safeParse(id).success) {
    return NextResponse.json({ error: "Image introuvable" }, { status: 404 })
  }
  const media = await prisma.vitrineMedia.findUnique({ where: { id } })
  if (!media) {
    return NextResponse.json({ error: "Image introuvable" }, { status: 404 })
  }
  const result = await readBlob(media.blob_url, request.headers.get("if-none-match") ?? undefined)
  if (result.status === 404) return NextResponse.json({ error: "Image introuvable" }, { status: 404 })
  const headers = new Headers({ "Cache-Control": "public, max-age=31536000, immutable" })
  if (result.status === 304) {
    if (result.etag) headers.set("ETag", result.etag)
    return new NextResponse(null, { status: 304, headers })
  }
  headers.set("Content-Type", media.content_type)
  if (result.content.size) headers.set("Content-Length", String(result.content.size))
  if (result.content.etag) headers.set("ETag", result.content.etag)
  return new NextResponse(result.content.stream, { status: 200, headers })
}
