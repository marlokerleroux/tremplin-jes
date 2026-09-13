/** Validation des images envoyées depuis l'administration (photos des finalistes, logos des partenaires). */

export const MAX_IMAGE_BYTES = 3 * 1024 * 1024
export const MAX_IMAGE_LABEL = "3 Mo"

export type ImageType = "image/jpeg" | "image/png" | "image/webp"

/** Type d'image d'après la signature du fichier (les en-têtes envoyés par le navigateur ne sont pas fiables). */
export function detectImageType(buffer: ArrayLike<number>): ImageType | null {
  if (buffer.length < 12) return null
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg"
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return "image/png"
  const riff = String.fromCharCode(buffer[0], buffer[1], buffer[2], buffer[3])
  const webp = String.fromCharCode(buffer[8], buffer[9], buffer[10], buffer[11])
  if (riff === "RIFF" && webp === "WEBP") return "image/webp"
  return null
}

export type ImageValidationError = "missing" | "size" | "type"

export async function readImageFile(
  value: FormDataEntryValue | null,
): Promise<{ ok: true; buffer: Buffer; contentType: ImageType; name: string } | { ok: false; error: ImageValidationError }> {
  if (!value || typeof value === "string" || value.size === 0) return { ok: false, error: "missing" }
  if (value.size > MAX_IMAGE_BYTES) return { ok: false, error: "size" }
  const buffer = Buffer.from(await value.arrayBuffer())
  const contentType = detectImageType(buffer)
  if (!contentType) return { ok: false, error: "type" }
  return { ok: true, buffer, contentType, name: value.name }
}

export function imageErrorMessage(error: ImageValidationError): string {
  switch (error) {
    case "missing":
      return "Aucune image fournie"
    case "size":
      return `L'image ne doit pas dépasser ${MAX_IMAGE_LABEL}`
    case "type":
      return "Formats acceptés : JPEG, PNG ou WebP"
  }
}
