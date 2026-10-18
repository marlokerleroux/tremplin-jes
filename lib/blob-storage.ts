import { BlobAccessError, del, get, put } from "@vercel/blob"

/**
 * Stockage des documents (fiches techniques, autorisations parentales) sur Vercel Blob.
 *
 * Le mode d'accès est une propriété du *store* Vercel Blob : pour que les fichiers soient réellement privés,
 * le projet doit être connecté à un store créé en mode « private » (voir README). Les fichiers historiques
 * restés sur l'ancien store public restent lisibles via leur URL ; `BLOB_READ_WRITE_TOKEN_LEGACY` permet
 * de les supprimer lors d'un remplacement ou d'une purge.
 */

const LEGACY_PUBLIC_HOST = ".public.blob.vercel-storage.com"

function isLegacyPublicUrl(url: string): boolean {
  return url.includes(LEGACY_PUBLIC_HOST)
}

function legacyTokenOptions(): { token: string } | undefined {
  const token = process.env.BLOB_READ_WRITE_TOKEN_LEGACY
  return token ? { token } : undefined
}

export async function uploadPrivatePdf(pathname: string, data: Buffer): Promise<string> {
  try {
    const blob = await put(pathname, data, {
      access: "private",
      contentType: "application/pdf",
      addRandomSuffix: true,
    })
    return blob.url
  } catch (error) {
    // Store encore public (accès refusé en mode privé) : on ne bloque pas les candidats, mais on le signale.
    // Toute autre erreur (indisponibilité, quota...) échoue : un document ne doit jamais devenir public par accident.
    if (error instanceof BlobAccessError) {
      console.error(
        "[blob] private upload failed (is the connected Blob store private?). Falling back to public access:",
        error.message,
      )
      const blob = await put(pathname, data, { access: "public", contentType: "application/pdf", addRandomSuffix: true })
      return blob.url
    }
    throw error
  }
}

export interface BlobContent {
  stream: ReadableStream<Uint8Array>
  contentType: string
  size: number | null
  etag: string | null
}

export type ReadBlobResult = { status: 200; content: BlobContent } | { status: 304; etag: string | null } | { status: 404 }

/**
 * Lit un blob par son URL (store privé ou ancien store public).
 * Retourne 304 si `ifNoneMatch` correspond à l'ETag courant.
 */
export async function readBlob(url: string, ifNoneMatch?: string): Promise<ReadBlobResult> {
  try {
    const result = await get(url, { access: "private", ifNoneMatch, ...legacyOptionsFor(url) })
    if (result === null) return { status: 404 }
    if (result.statusCode === 304) return { status: 304, etag: result.blob.etag ?? null }
    return {
      status: 200,
      content: {
        stream: result.stream,
        contentType: result.blob.contentType || "application/pdf",
        size: result.blob.size,
        etag: result.blob.etag ?? null,
      },
    }
  } catch (error) {
    console.warn("[blob] authenticated read failed, trying plain fetch:", error instanceof Error ? error.message : error)
  }
  try {
    const response = await fetch(url, { headers: ifNoneMatch ? { "If-None-Match": ifNoneMatch } : undefined })
    if (response.status === 304) return { status: 304, etag: response.headers.get("etag") }
    if (!response.ok || !response.body) return { status: 404 }
    const length = response.headers.get("content-length")
    return {
      status: 200,
      content: {
        stream: response.body,
        contentType: response.headers.get("content-type") || "application/pdf",
        size: length ? Number(length) : null,
        etag: response.headers.get("etag"),
      },
    }
  } catch (error) {
    console.error("[blob] public read failed:", error)
    return { status: 404 }
  }
}

function legacyOptionsFor(url: string): { token?: string } {
  return isLegacyPublicUrl(url) ? (legacyTokenOptions() ?? {}) : {}
}

export interface DeleteBlobsResult {
  deleted: number
  failed: string[]
}

/** Supprime un ou plusieurs blobs sans faire échouer l'appelant ; retourne les URL non supprimées. */
export async function deleteBlobs(urls: Array<string | null | undefined>): Promise<DeleteBlobsResult> {
  const valid = urls.filter((u): u is string => typeof u === "string" && u.length > 0)
  if (valid.length === 0) return { deleted: 0, failed: [] }
  const legacy = valid.filter(isLegacyPublicUrl)
  const current = valid.filter((u) => !isLegacyPublicUrl(u))
  const groups: Array<{ urls: string[]; options?: { token: string } }> = []
  if (current.length > 0) groups.push({ urls: current })
  if (legacy.length > 0) groups.push({ urls: legacy, options: legacyTokenOptions() })
  const failed: string[] = []
  const results = await Promise.allSettled(groups.map((g) => del(g.urls, g.options)))
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error("[blob] delete failed:", result.reason)
      failed.push(...groups[index].urls)
    }
  })
  return { deleted: valid.length - failed.length, failed }
}

export async function deleteBlob(url: string | null | undefined): Promise<DeleteBlobsResult> {
  return deleteBlobs([url])
}

/** Envoi d'un fichier quelconque (images du site vitrine) sur le store privé. */
export async function uploadPrivateFile(pathname: string, data: Buffer, contentType: string): Promise<string> {
  const blob = await put(pathname, data, { access: "private", contentType, addRandomSuffix: true })
  return blob.url
}
