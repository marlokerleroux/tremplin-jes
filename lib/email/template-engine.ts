/**
 * Moteur de modèles d'emails modifiables par l'administration : texte brut avec des
 * variables `{{nom_variable}}`, converti en HTML sûr (échappement, paragraphes, liens).
 * Module pur (sans dépendance) : testé avec Vitest.
 */

export type TemplateVars = Record<string, string | number | null | undefined>

const PLACEHOLDER = /\{\{\s*([a-z0-9_]+)\s*\}\}/gi
const URL_PATTERN = /(https?:\/\/[^\s<>"')\]]+[^\s<>"')\].,;:!?])/g

export function escapeHtml(value: string | number | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/** Remplace les variables ; une variable inconnue est laissée vide. */
export function substitute(template: string, vars: TemplateVars): string {
  return template.replace(PLACEHOLDER, (_match, name: string) => {
    const value = vars[name.toLowerCase()]
    return value === null || value === undefined ? "" : String(value)
  })
}

/** Variables référencées dans un texte (dédoublonnées, en minuscules). */
export function extractPlaceholders(template: string): string[] {
  const found = new Set<string>()
  for (const match of template.matchAll(PLACEHOLDER)) {
    found.add(match[1].toLowerCase())
  }
  return Array.from(found)
}

/** Convertit un texte brut en HTML : paragraphes (ligne vide), retours à la ligne, liens cliquables. */
export function textToHtml(text: string): string {
  const paragraphs = text.replace(/\r\n/g, "\n").trim().split(/\n{2,}/)
  return paragraphs
    .map((paragraph) => {
      const escaped = escapeHtml(paragraph)
      const linked = escaped.replace(URL_PATTERN, (url) => `<a href="${url}" style="color: #246BDC;">${url}</a>`)
      return `<p style="margin: 0 0 16px 0;">${linked.replace(/\n/g, "<br>")}</p>`
    })
    .join("\n")
}

export interface RenderedEmail {
  subject: string
  text: string
  html: string
}

/** Rend un modèle (sujet + corps texte) avec ses variables. Le HTML du corps n'est pas encore mis en page. */
export function renderTemplate(subject: string, body: string, vars: TemplateVars): RenderedEmail {
  const renderedSubject = substitute(subject, vars).replace(/\s+/g, " ").trim()
  const renderedText = substitute(body, vars).replace(/\r\n/g, "\n").trim()
  return { subject: renderedSubject, text: renderedText, html: textToHtml(renderedText) }
}
