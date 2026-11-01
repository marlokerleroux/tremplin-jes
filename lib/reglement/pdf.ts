import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib"
import { LOGO_PNG_BASE64 } from "@/lib/email/logo"
import { parseRules, type TextRun } from "./markup"

/** Génère le PDF du règlement (A4, Helvetica) à partir du titre et du texte déjà rendus (variables remplacées). */

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN_X = 56
const MARGIN_TOP = 56
const MARGIN_BOTTOM = 64
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN_X

const BODY_SIZE = 10.5
const BODY_LEADING = 15
const BRAND = rgb(0x24 / 255, 0x6b / 255, 0xdc / 255)
const TEXT = rgb(0.13, 0.13, 0.13)
const MUTED = rgb(0.45, 0.45, 0.45)

// Caractères hors WinAnsi (non gérés par les polices standard) remplacés par un équivalent.
const REPLACEMENTS: Record<string, string> = {
  "→": "->",
  "←": "<-",
  "∙": "•",
  "·": "•",
  " ": " ",
  " ": " ",
  "‑": "-",
  "−": "-",
  "≤": "<=",
  "≥": ">=",
  "✓": "v",
  "\t": "  ",
}

interface Fonts {
  regular: PDFFont
  bold: PDFFont
}

interface Word {
  text: string
  bold: boolean
  space: boolean // suivi d'une espace
}

function makeSanitizer(font: PDFFont) {
  const supported = new Set(font.getCharacterSet())
  return (text: string) =>
    Array.from(text.normalize("NFC"))
      .map((char) => {
        if (supported.has(char.codePointAt(0) ?? 0)) return char
        const replacement = REPLACEMENTS[char]
        if (replacement !== undefined) return replacement
        // Lettre accentuée inconnue : on garde la lettre de base.
        const base = char.normalize("NFD").replace(/[̀-ͯ]/g, "")
        return base !== char && Array.from(base).every((c) => supported.has(c.codePointAt(0) ?? 0)) ? base : ""
      })
      .join("")
}

function toWords(runs: TextRun[]): Word[] {
  const words: Word[] = []
  for (const run of runs) {
    for (const part of run.text.split(/(\s+)/)) {
      if (part === "") continue
      if (/^\s+$/.test(part)) {
        if (words.length > 0) words[words.length - 1].space = true
        continue
      }
      words.push({ text: part, bold: run.bold, space: false })
    }
  }
  return words
}

type Line = Word[]

function wrap(words: Word[], fonts: Fonts, size: number, maxWidth: number): Line[] {
  const font = (w: Word) => (w.bold ? fonts.bold : fonts.regular)
  const width = (w: Word) => font(w).widthOfTextAtSize(w.text, size)
  const spaceWidth = fonts.regular.widthOfTextAtSize(" ", size)

  const lines: Line[] = []
  let line: Line = []
  let lineWidth = 0

  const pushWord = (word: Word) => {
    const w = width(word)
    const gap = line.length > 0 && line[line.length - 1].space ? spaceWidth : 0
    if (line.length > 0 && lineWidth + gap + w > maxWidth) {
      lines.push(line)
      line = []
      lineWidth = 0
    }
    if (line.length === 0 && w > maxWidth) {
      // Mot plus long que la ligne (URL...) : coupure par caractères.
      let chunk = ""
      for (const char of Array.from(word.text)) {
        if (chunk && font(word).widthOfTextAtSize(chunk + char, size) > maxWidth) {
          lines.push([{ ...word, text: chunk, space: false }])
          chunk = ""
        }
        chunk += char
      }
      line = [{ ...word, text: chunk }]
      lineWidth = font(word).widthOfTextAtSize(chunk, size)
      return
    }
    lineWidth += (line.length > 0 && line[line.length - 1].space ? spaceWidth : 0) + w
    line.push(word)
  }

  for (const word of words) pushWord(word)
  if (line.length > 0) lines.push(line)
  return lines
}

export interface RulesPdfInput {
  title: string
  body: string
  footer: string
  updatedAt?: string | null
  /** Métadonnée « Sujet » du PDF (par défaut : règlement). */
  subject?: string
}

export async function renderRulesPdf(input: RulesPdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const fonts: Fonts = { regular, bold }
  const clean = makeSanitizer(regular)

  const title = clean(input.title.replace(/\s+/g, " ").trim())
  doc.setTitle(title || "Règlement du tremplin")
  doc.setAuthor("Association Pass'Musique")
  doc.setSubject(input.subject ?? "Règlement du Tremplin Jeunes en Scène")
  doc.setLanguage("fr-FR")
  doc.setCreator("Tremplin Jeunes en Scène")

  let page: PDFPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  let y = PAGE_HEIGHT - MARGIN_TOP

  const newPage = () => {
    page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    y = PAGE_HEIGHT - MARGIN_TOP
  }
  const ensure = (height: number) => {
    if (y - height < MARGIN_BOTTOM) newPage()
  }

  const drawLine = (line: Line, x: number, size: number, color = TEXT) => {
    let cursor = x
    const spaceWidth = regular.widthOfTextAtSize(" ", size)
    for (const word of line) {
      const font = word.bold ? bold : regular
      page.drawText(word.text, { x: cursor, y, size, font, color })
      cursor += font.widthOfTextAtSize(word.text, size) + (word.space ? spaceWidth : 0)
    }
  }

  const lineWidth = (line: Line, size: number) =>
    line.reduce(
      (sum, word, i) =>
        sum + (word.bold ? bold : regular).widthOfTextAtSize(word.text, size) + (word.space && i < line.length - 1 ? regular.widthOfTextAtSize(" ", size) : 0),
      0,
    )

  // En-tête : logo et titre centrés.
  const logo = await doc.embedPng(LOGO_PNG_BASE64)
  const logoSize = logo.scaleToFit(170, 70)
  page.drawImage(logo, { x: (PAGE_WIDTH - logoSize.width) / 2, y: y - logoSize.height, width: logoSize.width, height: logoSize.height })
  y -= logoSize.height + 28

  const titleSize = 17
  for (const line of wrap(toWords([{ text: title, bold: true }]), fonts, titleSize, CONTENT_WIDTH)) {
    drawLine(line, (PAGE_WIDTH - lineWidth(line, titleSize)) / 2, titleSize, BRAND)
    y -= titleSize * 1.35
  }
  y -= 4
  page.drawLine({ start: { x: MARGIN_X, y }, end: { x: PAGE_WIDTH - MARGIN_X, y }, thickness: 0.8, color: BRAND })
  y -= 22

  const sanitizeRuns = (runs: TextRun[]) => runs.map((run) => ({ ...run, text: clean(run.text) }))

  let previous: string | null = null
  for (const block of parseRules(input.body)) {
    if (block.type === "heading") {
      const size = block.level === 1 ? 13 : 11.5
      const lines = wrap(toWords(sanitizeRuns(block.runs).map((r) => ({ ...r, bold: true }))), fonts, size, CONTENT_WIDTH)
      if (previous) y -= block.level === 1 ? 12 : 6
      // Un titre ne reste jamais seul en bas de page.
      ensure(lines.length * size * 1.3 + BODY_LEADING * 2)
      for (const line of lines) {
        drawLine(line, MARGIN_X, size, block.level === 1 ? BRAND : TEXT)
        y -= size * 1.3
      }
      y -= 4
    } else if (block.type === "paragraph") {
      if (previous && previous !== "heading") y -= 7
      for (const runs of block.lines) {
        for (const line of wrap(toWords(sanitizeRuns(runs)), fonts, BODY_SIZE, CONTENT_WIDTH)) {
          ensure(BODY_LEADING)
          drawLine(line, MARGIN_X, BODY_SIZE)
          y -= BODY_LEADING
        }
      }
    } else {
      if (previous === "paragraph") y -= 2
      else if (previous === "bullet") y -= 3
      const indent = block.level === 0 ? 10 : 30
      const textX = MARGIN_X + indent + 12
      const lines = wrap(toWords(sanitizeRuns(block.runs)), fonts, BODY_SIZE, PAGE_WIDTH - MARGIN_X - textX)
      lines.forEach((line, i) => {
        ensure(BODY_LEADING)
        if (i === 0) {
          page.drawText(block.level === 0 ? "•" : "–", { x: MARGIN_X + indent, y, size: BODY_SIZE, font: regular, color: block.level === 0 ? BRAND : TEXT })
        }
        drawLine(line, textX, BODY_SIZE)
        y -= BODY_LEADING
      })
    }
    previous = block.type
  }

  // Pied de page : intitulé, date de mise à jour et pagination.
  const pages = doc.getPages()
  const footer = clean(input.footer)
  const updated = input.updatedAt ? clean(`Mis à jour le ${input.updatedAt}`) : ""
  pages.forEach((p, index) => {
    const size = 8
    const label = `Page ${index + 1} / ${pages.length}`
    p.drawLine({ start: { x: MARGIN_X, y: 44 }, end: { x: PAGE_WIDTH - MARGIN_X, y: 44 }, thickness: 0.4, color: MUTED })
    p.drawText(updated ? `${footer} — ${updated}` : footer, { x: MARGIN_X, y: 32, size, font: regular, color: MUTED })
    p.drawText(label, { x: PAGE_WIDTH - MARGIN_X - regular.widthOfTextAtSize(label, size), y: 32, size, font: regular, color: MUTED })
  })

  return doc.save()
}
