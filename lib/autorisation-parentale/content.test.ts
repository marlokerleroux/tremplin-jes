import { describe, expect, it } from "vitest"
import { parentalAuthorizationContent } from "./content"

const season = {
  edition: 2027,
  registration_opens_at: null,
  registration_closes_at: null,
  audition_dates: ["2027-01-23", "2027-01-30"],
  age_reference_date: null as string | null,
}

describe("parentalAuthorizationContent", () => {
  it("utilise la date de référence pour l'âge configurée", () => {
    const { body, filename } = parentalAuthorizationContent({ ...season, age_reference_date: "2027-01-31" })
    expect(body).toContain("mineur au 31/01/2027")
    expect(body).toContain("Saison 2026/2027")
    expect(filename).toBe("autorisation-parentale-2027.pdf")
  })

  it("se rabat sur la dernière date d'audition", () => {
    expect(parentalAuthorizationContent(season).body).toContain("mineur au 30/01/2027")
  })

  it("se rabat sur le 31 janvier de l'édition", () => {
    expect(parentalAuthorizationContent({ ...season, audition_dates: [] }).body).toContain("mineur au 31/01/2027")
  })
})
