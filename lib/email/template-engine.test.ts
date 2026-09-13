import { describe, expect, it } from "vitest"
import { extractPlaceholders, renderTemplate, substitute, textToHtml } from "./template-engine"

describe("substitute", () => {
  it("remplace les variables, insensible à la casse et aux espaces", () => {
    expect(substitute("Bonjour {{prenom}} {{ NOM }}", { prenom: "Léa", nom: "Test" })).toBe("Bonjour Léa Test")
  })
  it("laisse vide une variable inconnue ou nulle", () => {
    expect(substitute("A{{inconnue}}B{{vide}}C", { vide: null })).toBe("ABC")
  })
})

describe("extractPlaceholders", () => {
  it("liste les variables sans doublon", () => {
    expect(extractPlaceholders("{{a}} et {{b}} puis {{A}}")).toEqual(["a", "b"])
  })
})

describe("textToHtml", () => {
  it("échappe le HTML saisi par l'administrateur", () => {
    expect(textToHtml("<script>alert(1)</script>")).toBe('<p style="margin: 0 0 16px 0;">&lt;script&gt;alert(1)&lt;/script&gt;</p>')
  })
  it("crée des paragraphes et des retours à la ligne", () => {
    const html = textToHtml("Ligne 1\nLigne 2\n\nParagraphe 2")
    expect(html).toContain("Ligne 1<br>Ligne 2")
    expect(html.match(/<p /g)).toHaveLength(2)
  })
  it("rend les URL cliquables sans inclure la ponctuation finale", () => {
    const html = textToHtml("Voir https://candidat.example.fr/dashboard.")
    expect(html).toContain('<a href="https://candidat.example.fr/dashboard"')
    expect(html).toContain("</a>.")
  })
})

describe("renderTemplate", () => {
  it("rend sujet, texte et HTML avec les variables", () => {
    const rendered = renderTemplate("Résultats {{edition}}", "Bonjour {{prenom}},\n\nBravo {{nom_scene}} !", {
      edition: 2027,
      prenom: "Léa",
      nom_scene: "Léa <Solo>",
    })
    expect(rendered.subject).toBe("Résultats 2027")
    expect(rendered.text).toBe("Bonjour Léa,\n\nBravo Léa <Solo> !")
    expect(rendered.html).toContain("Bravo Léa &lt;Solo&gt; !")
  })
})
