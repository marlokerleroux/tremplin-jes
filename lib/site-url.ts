/** URL publique de l'espace candidat (liens dans les emails). */
export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL || process.env.AUTH_URL || "https://candidat.tremplin-jeunes-en-scene.fr"
  return url.replace(/\/+$/, "")
}
