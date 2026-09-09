import { describe, expect, it } from "vitest"
import {
  computeAgeAt,
  formatDateFr,
  generateTimeSlots,
  getAgeReferenceDate,
  getRegistrationStatus,
  isMinorAt,
  parseIsoDate,
  validateEligibility,
} from "./season"

describe("computeAgeAt", () => {
  it("calcule l'âge révolu à la date de référence", () => {
    expect(computeAgeAt("2010-01-31", "2026-01-31")).toBe(16)
    expect(computeAgeAt("2010-02-01", "2026-01-31")).toBe(15)
    expect(computeAgeAt("2013-01-31", "2026-01-31")).toBe(13)
    expect(computeAgeAt("2002-02-01", "2026-01-31")).toBe(23)
    expect(computeAgeAt("2002-01-31", "2026-01-31")).toBe(24)
  })
  it("retourne null pour une date invalide", () => {
    expect(computeAgeAt("31/01/2010", "2026-01-31")).toBeNull()
    expect(computeAgeAt("2010-02-30", "2026-01-31")).toBeNull()
    expect(computeAgeAt("", "2026-01-31")).toBeNull()
  })
})

describe("isMinorAt", () => {
  it("détecte les mineurs au jour de l'audition", () => {
    expect(isMinorAt("2008-02-01", "2026-01-31")).toBe(true)
    expect(isMinorAt("2008-01-31", "2026-01-31")).toBe(false)
  })
})

describe("validateEligibility", () => {
  const ref = "2027-01-30"
  it("accepte un solo de 13 à 23 ans inclus", () => {
    expect(validateEligibility("solo", [{ firstName: "", lastName: "", birthDate: "2014-01-30" }], ref).valid).toBe(true)
    expect(validateEligibility("solo", [{ firstName: "", lastName: "", birthDate: "2003-01-31" }], ref).valid).toBe(true)
  })
  it("refuse un solo trop jeune ou trop âgé", () => {
    expect(validateEligibility("solo", [{ firstName: "", lastName: "", birthDate: "2014-01-31" }], ref).valid).toBe(false)
    expect(validateEligibility("solo", [{ firstName: "", lastName: "", birthDate: "2003-01-30" }], ref).valid).toBe(false)
  })
  it("applique la moyenne de 23 ans et la borne de 25 ans pour un groupe", () => {
    const ok = validateEligibility(
      "group",
      [
        { firstName: "A", lastName: "A", birthDate: "2002-01-01" }, // 25
        { firstName: "B", lastName: "B", birthDate: "2006-01-01" }, // 21
      ],
      ref,
    )
    expect(ok.valid).toBe(true)
    const tooOld = validateEligibility(
      "group",
      [
        { firstName: "A", lastName: "A", birthDate: "2001-01-01" }, // 26
        { firstName: "B", lastName: "B", birthDate: "2010-01-01" },
      ],
      ref,
    )
    expect(tooOld.valid).toBe(false)
    expect(tooOld.errors[0]).toContain("A A")
    const avgTooHigh = validateEligibility(
      "group",
      [
        { firstName: "A", lastName: "A", birthDate: "2002-01-01" }, // 25
        { firstName: "B", lastName: "B", birthDate: "2003-01-01" }, // 24
      ],
      ref,
    )
    expect(avgTooHigh.valid).toBe(false)
    expect(avgTooHigh.errors[0]).toContain("moyenne")
  })
  it("signale une date invalide", () => {
    const res = validateEligibility("group", [{ firstName: "A", lastName: "A", birthDate: "" }], ref)
    expect(res.valid).toBe(false)
  })
})

describe("getRegistrationStatus", () => {
  const base = { edition: 2027, audition_dates: [], age_reference_date: null }
  it("ouvert sans bornes", () => {
    expect(getRegistrationStatus({ ...base, registration_opens_at: null, registration_closes_at: null })).toBe("open")
  })
  it("pas encore ouvert avant la date d'ouverture", () => {
    expect(
      getRegistrationStatus(
        { ...base, registration_opens_at: "2026-10-15T00:00:00Z", registration_closes_at: null },
        new Date("2026-09-09T10:00:00Z"),
      ),
    ).toBe("not_yet_open")
  })
  it("clos à partir de la date de clôture", () => {
    expect(
      getRegistrationStatus(
        { ...base, registration_opens_at: null, registration_closes_at: "2025-12-31T23:00:00Z" },
        new Date("2026-09-09T10:00:00Z"),
      ),
    ).toBe("closed")
    expect(
      getRegistrationStatus(
        { ...base, registration_opens_at: "2026-10-15T00:00:00Z", registration_closes_at: "2026-12-31T23:00:00Z" },
        new Date("2026-11-01T10:00:00Z"),
      ),
    ).toBe("open")
  })
})

describe("getAgeReferenceDate", () => {
  it("préfère la date configurée, sinon la dernière date d'audition", () => {
    expect(getAgeReferenceDate({ edition: 2027, registration_opens_at: null, registration_closes_at: null, audition_dates: ["2027-02-06", "2027-01-30"], age_reference_date: null })).toBe("2027-02-06")
    expect(getAgeReferenceDate({ edition: 2027, registration_opens_at: null, registration_closes_at: null, audition_dates: ["2027-02-06"], age_reference_date: "2027-01-30" })).toBe("2027-01-30")
    expect(getAgeReferenceDate({ edition: 2027, registration_opens_at: null, registration_closes_at: null, audition_dates: [], age_reference_date: null })).toBe("2027-01-31")
  })
})

describe("generateTimeSlots", () => {
  it("génère des créneaux de 10 minutes", () => {
    const slots = generateTimeSlots({ date: "2027-01-30", startTime: "10:00", endTime: "10:30", durationMinutes: 10 })
    expect(slots).toEqual([
      { date: "2027-01-30", start_time: "10:00", end_time: "10:10" },
      { date: "2027-01-30", start_time: "10:10", end_time: "10:20" },
      { date: "2027-01-30", start_time: "10:20", end_time: "10:30" },
    ])
  })
  it("ignore le dernier créneau incomplet et les paramètres invalides", () => {
    expect(generateTimeSlots({ date: "2027-01-30", startTime: "10:00", endTime: "10:25", durationMinutes: 10 })).toHaveLength(2)
    expect(generateTimeSlots({ date: "2027-01-30", startTime: "11:00", endTime: "10:00", durationMinutes: 10 })).toEqual([])
    expect(generateTimeSlots({ date: "30/01/2027", startTime: "10:00", endTime: "11:00", durationMinutes: 10 })).toEqual([])
  })
})

describe("formatDateFr / parseIsoDate", () => {
  it("formate sans décalage horaire", () => {
    expect(formatDateFr("2026-01-31")).toBe("samedi 31 janvier 2026")
    expect(formatDateFr("2026-02-01", { weekday: false })).toBe("1 février 2026")
    expect(parseIsoDate("2026-02-30")).toBeNull()
  })
})
