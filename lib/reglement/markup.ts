/**
 * Mise en forme du règlement saisi dans l'administration : texte brut avec une syntaxe minimale
 * (titres, puces, gras) et des variables `{{nom_variable}}` remplacées par les données de la saison.
 * Module pur (sans dépendance) : testé avec Vitest.
 *
 *   # Titre de section        ## Sous-titre
 *   - Puce                      (indentée de 2 espaces ou plus : sous-puce)
 *   **texte en gras**
 *   Une ligne vide sépare les paragraphes ; un retour à la ligne simple est conservé.
 */

export interface TextRun {
  text: string
  bold: boolean
}

export type RulesBlock =
  | { type: "heading"; level: 1 | 2; runs: TextRun[] }
  | { type: "paragraph"; lines: TextRun[][] }
  | { type: "bullet"; level: 0 | 1; runs: TextRun[] }

const HEADING = /^(#{1,2})\s+(.*)$/
const BULLET = /^(\s*)[-*•∙·]\s+(.*)$/

/** Découpe une ligne en segments normaux / gras (`**...**`). Un `**` orphelin reste tel quel. */
export function parseInline(text: string): TextRun[] {
  const runs: TextRun[] = []
  const pattern = /\*\*(.+?)\*\*/g
  let last = 0
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0
    if (index > last) runs.push({ text: text.slice(last, index), bold: false })
    runs.push({ text: match[1], bold: true })
    last = index + match[0].length
  }
  if (last < text.length) runs.push({ text: text.slice(last), bold: false })
  return runs.filter((run) => run.text.length > 0)
}

export function parseRules(source: string): RulesBlock[] {
  const blocks: RulesBlock[] = []
  let paragraph: TextRun[][] | null = null
  let lastBullet: Extract<RulesBlock, { type: "bullet" }> | null = null

  const closeParagraph = () => {
    if (paragraph && paragraph.length > 0) blocks.push({ type: "paragraph", lines: paragraph })
    paragraph = null
  }

  for (const rawLine of source.replace(/\r\n?/g, "\n").split("\n")) {
    const line = rawLine.replace(/\s+$/, "")
    if (line.trim() === "") {
      closeParagraph()
      lastBullet = null
      continue
    }

    const heading = HEADING.exec(line.trim())
    if (heading) {
      closeParagraph()
      lastBullet = null
      blocks.push({ type: "heading", level: heading[1].length === 1 ? 1 : 2, runs: parseInline(heading[2].trim()) })
      continue
    }

    const bullet = BULLET.exec(line)
    if (bullet) {
      closeParagraph()
      const indent = bullet[1].replace(/\t/g, "  ").length
      lastBullet = { type: "bullet", level: indent >= 2 ? 1 : 0, runs: parseInline(bullet[2].trim()) }
      blocks.push(lastBullet)
      continue
    }

    // Ligne de continuation d'une puce (sans marqueur, juste après) : même puce.
    if (lastBullet) {
      lastBullet.runs.push({ text: " ", bold: false }, ...parseInline(line.trim()))
      continue
    }

    paragraph ??= []
    paragraph.push(parseInline(line.trim()))
  }
  closeParagraph()
  return blocks
}

/** Liste française : "a", "a et b", "a, b et c". */
export function joinFr(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ""
  return `${items.slice(0, -1).join(", ")} et ${items[items.length - 1]}`
}

/** Saison sur deux années à partir de l'édition (année de la finale) : 2027 → "2026/2027". */
export function seasonLabel(edition: number): string {
  return `${edition - 1}/${edition}`
}
