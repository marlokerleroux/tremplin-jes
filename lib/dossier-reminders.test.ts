import { describe, expect, it } from "vitest"
import { dueDossierReminder, formatMissingDocuments, getMissingDocuments, isComplete } from "./dossier-reminders"

const REF = "2027-01-30"
const adult = { firstName: "Léa", lastName: "Le Gall", birthDate: "2000-05-01" }
const minor = { firstName: "Tom", lastName: "Guen", birthDate: "2012-03-10" }

describe("getMissingDocuments", () => {
  it("détecte la fiche technique et les autorisations des mineurs", () => {
    const missing = getMissingDocuments({ members: [adult, minor], hasTechnicalSheet: false, providedAuthorizations: [], ageReferenceDate: REF })
    expect(missing).toEqual({ technicalSheet: true, parentalAuthorizations: [{ index: 1, name: "Tom Guen" }] })
    expect(isComplete(missing)).toBe(false)
  })

  it("ignore les majeurs et les autorisations déjà déposées", () => {
    const missing = getMissingDocuments({ members: [adult, minor], hasTechnicalSheet: true, providedAuthorizations: [1], ageReferenceDate: REF })
    expect(isComplete(missing)).toBe(true)
  })

  it("liste les pièces en texte brut", () => {
    const missing = getMissingDocuments({ members: [minor], hasTechnicalSheet: false, providedAuthorizations: [], ageReferenceDate: REF })
    expect(formatMissingDocuments(missing, false)).toBe("- la fiche technique\n- l'autorisation parentale (candidat mineur)")
    expect(formatMissingDocuments(missing, true)).toBe("- la fiche technique\n- l'autorisation parentale de Tom Guen (mineur)")
  })
})

describe("dueDossierReminder", () => {
  const settings = { enabled: true, intervalDays: 7, finalDays: 3 }
  const closesAt = new Date("2026-12-15T22:59:00Z") // 15 décembre 23:59 à Paris
  const at = (day: string) => new Date(`${day}T08:00:00Z`)
  const due = (now: string, submitted: string, last: string | null, s = settings) =>
    dueDossierReminder({ now: at(now), closesAt, submittedAt: at(submitted), lastSentAt: last ? at(last) : null, settings: s })

  it("attend le délai après l'envoi de la candidature", () => {
    expect(due("2026-11-02", "2026-11-01", null)).toBeNull()
    expect(due("2026-11-07", "2026-11-01", null)).toBeNull()
    expect(due("2026-11-08", "2026-11-01", null)).toBe("regular")
  })

  it("relance chaque semaine depuis la dernière relance", () => {
    expect(due("2026-11-14", "2026-11-01", "2026-11-08")).toBeNull()
    expect(due("2026-11-15", "2026-11-01", "2026-11-08")).toBe("regular")
  })

  it("envoie une seule relance renforcée à l'approche de la clôture", () => {
    expect(due("2026-12-12", "2026-11-01", "2026-12-06")).toBe("final")
    expect(due("2026-12-13", "2026-11-01", "2026-12-12")).toBeNull()
    expect(due("2026-12-15", "2026-11-01", "2026-12-12")).toBeNull()
  })

  it("laisse un jour d'écart avec une relance régulière récente", () => {
    expect(due("2026-12-12", "2026-11-01", "2026-12-11")).toBeNull()
    expect(due("2026-12-13", "2026-11-01", "2026-12-11")).toBe("final")
  })

  it("relance tôt un dossier envoyé juste avant la clôture", () => {
    expect(due("2026-12-13", "2026-12-11", null)).toBe("final")
    expect(due("2026-12-12", "2026-12-11", null)).toBeNull()
  })

  it("s'arrête à la clôture, sans date de clôture ou si désactivé", () => {
    expect(dueDossierReminder({ now: new Date("2026-12-15T23:00:00Z"), closesAt, submittedAt: at("2026-11-01"), lastSentAt: null, settings })).toBeNull()
    expect(dueDossierReminder({ now: at("2026-11-20"), closesAt: null, submittedAt: at("2026-11-01"), lastSentAt: null, settings })).toBeNull()
    expect(due("2026-11-20", "2026-11-01", null, { ...settings, enabled: false })).toBeNull()
  })

  it("sans fenêtre renforcée, garde le rythme régulier jusqu'au bout", () => {
    expect(due("2026-12-13", "2026-11-01", "2026-12-06", { ...settings, finalDays: 0 })).toBe("regular")
    expect(due("2026-12-12", "2026-11-01", "2026-12-06", { ...settings, finalDays: 0 })).toBeNull()
  })
})
