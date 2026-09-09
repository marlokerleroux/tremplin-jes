/** Taille maximale acceptée pour un PDF (limite du corps de requête sur Vercel : 4,5 Mo). */
export const MAX_PDF_BYTES = 4.5 * 1024 * 1024
export const MAX_PDF_LABEL = "4,5 Mo"

/** Vérifie la signature d'un fichier PDF ("%PDF-"). */
export function isPdfBuffer(buffer: ArrayLike<number>): boolean {
  if (buffer.length < 5) return false
  return (
    buffer[0] === 0x25 && // %
    buffer[1] === 0x50 && // P
    buffer[2] === 0x44 && // D
    buffer[3] === 0x46 && // F
    buffer[4] === 0x2d // -
  )
}

export type PdfValidationError = "missing" | "type" | "size" | "content"

/** Valide un fichier reçu via FormData. Retourne le buffer ou une erreur. */
export async function readPdfFile(
  value: FormDataEntryValue | null,
): Promise<{ ok: true; buffer: Buffer; name: string; size: number } | { ok: false; error: PdfValidationError }> {
  if (!value || typeof value === "string") return { ok: false, error: "missing" }
  const file = value
  if (file.size === 0) return { ok: false, error: "missing" }
  if (file.size > MAX_PDF_BYTES) return { ok: false, error: "size" }
  if (file.type && file.type !== "application/pdf") return { ok: false, error: "type" }
  const buffer = Buffer.from(await file.arrayBuffer())
  if (!isPdfBuffer(buffer)) return { ok: false, error: "content" }
  return { ok: true, buffer, name: file.name, size: file.size }
}

export function pdfErrorMessage(error: PdfValidationError): string {
  switch (error) {
    case "missing":
      return "Aucun fichier fourni"
    case "type":
      return "Seuls les fichiers PDF sont acceptés"
    case "size":
      return `Le fichier ne doit pas dépasser ${MAX_PDF_LABEL}`
    case "content":
      return "Le fichier n'est pas un PDF valide"
  }
}
