import { NextResponse } from "next/server"
import { readBlob } from "@/lib/blob-storage"

/** Diffuse un PDF stocké sur Vercel Blob à un utilisateur authentifié (jamais mis en cache partagé). */
export async function streamPdf(url: string, filename: string, request?: Request): Promise<NextResponse> {
  const ifNoneMatch = request?.headers.get("if-none-match") ?? undefined
  const result = await readBlob(url, ifNoneMatch)

  const baseHeaders: Record<string, string> = {
    "Cache-Control": "private, no-cache",
    "X-Content-Type-Options": "nosniff",
  }

  if (result.status === 404) {
    return NextResponse.json({ error: "Document introuvable" }, { status: 404 })
  }
  if (result.status === 304) {
    return new NextResponse(null, { status: 304, headers: { ...baseHeaders, ...(result.etag ? { ETag: result.etag } : {}) } })
  }

  const safeName = filename.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_")
  const headers = new Headers({
    ...baseHeaders,
    "Content-Type": "application/pdf",
    "Content-Disposition": `inline; filename="${safeName}"`,
  })
  if (result.content.size) headers.set("Content-Length", String(result.content.size))
  if (result.content.etag) headers.set("ETag", result.content.etag)
  return new NextResponse(result.content.stream, { status: 200, headers })
}
