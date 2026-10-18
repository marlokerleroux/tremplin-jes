import { describe, expect, it } from "vitest"
import { joinFr, parseInline, parseRules, seasonLabel } from "./markup"

describe("parseInline", () => {
  it("découpe le gras", () => {
    expect(parseInline("avant le **31 décembre** inclus")).toEqual([
      { text: "avant le ", bold: false },
      { text: "31 décembre", bold: true },
      { text: " inclus", bold: false },
    ])
  })
  it("laisse un ** orphelin tel quel", () => {
    expect(parseInline("a ** b")).toEqual([{ text: "a ** b", bold: false }])
  })
})

describe("parseRules", () => {
  it("reconnaît titres, paragraphes et puces", () => {
    const blocks = parseRules("# 1 – Organisation\n\nLigne 1\nLigne 2\n\n- puce\n  - sous-puce\n• autre\n## Détail")
    expect(blocks.map((b) => b.type)).toEqual(["heading", "paragraph", "bullet", "bullet", "bullet", "heading"])
    expect(blocks[0]).toEqual({ type: "heading", level: 1, runs: [{ text: "1 – Organisation", bold: false }] })
    expect(blocks[1]).toMatchObject({ type: "paragraph", lines: [[{ text: "Ligne 1" }], [{ text: "Ligne 2" }]] })
    expect(blocks[3]).toMatchObject({ type: "bullet", level: 1 })
    expect(blocks[5]).toMatchObject({ type: "heading", level: 2 })
  })
  it("rattache une ligne sans marqueur à la puce précédente", () => {
    const blocks = parseRules("- début\nsuite\n\nParagraphe")
    expect(blocks).toHaveLength(2)
    expect(blocks[0]).toMatchObject({ type: "bullet", runs: [{ text: "début" }, { text: " " }, { text: "suite" }] })
  })
  it("ignore les lignes vides multiples et les fins de ligne Windows", () => {
    expect(parseRules("\r\n\r\nTexte\r\n\r\n\r\n")).toHaveLength(1)
  })
})

describe("joinFr / seasonLabel", () => {
  it("liste à la française", () => {
    expect(joinFr([])).toBe("")
    expect(joinFr(["a"])).toBe("a")
    expect(joinFr(["a", "b", "c"])).toBe("a, b et c")
  })
  it("saison sur deux années", () => {
    expect(seasonLabel(2027)).toBe("2026/2027")
  })
})
