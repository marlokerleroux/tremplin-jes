import { describe, expect, it } from "vitest"
import { buildAuditionIcs, parisOffsetMinutes, parisToUtc } from "./ics"

describe("parisToUtc", () => {
  it("convertit l'heure d'hiver (UTC+1)", () => {
    expect(parisToUtc("2027-01-30", "14:30")?.toISOString()).toBe("2027-01-30T13:30:00.000Z")
  })
  it("convertit l'heure d'été (UTC+2)", () => {
    expect(parisToUtc("2027-06-15", "10:00")?.toISOString()).toBe("2027-06-15T08:00:00.000Z")
  })
  it("retourne null pour des données invalides", () => {
    expect(parisToUtc("2027-13-01", "10:00")).toBeNull()
    expect(parisToUtc("2027-01-30", "25:00")).toBeNull()
  })
  it("connaît le décalage de Paris", () => {
    expect(parisOffsetMinutes(new Date("2027-01-30T12:00:00Z"))).toBe(60)
    expect(parisOffsetMinutes(new Date("2027-07-01T12:00:00Z"))).toBe(120)
  })
})

describe("buildAuditionIcs", () => {
  it("génère un événement valide avec échappement", () => {
    const ics = buildAuditionIcs({
      uid: "app-1@tremplin",
      date: "2027-01-30",
      startTime: "14:30",
      endTime: "14:40",
      summary: "Audition : Les Embruns",
      description: "Ligne 1\nLigne 2, avec virgule; et point-virgule",
      location: "Espace Léo Ferré, Brest",
      now: new Date("2027-01-01T10:00:00Z"),
    })
    expect(ics).toContain("DTSTART:20270130T133000Z")
    expect(ics).toContain("DTEND:20270130T134000Z")
    expect(ics).toContain("DTSTAMP:20270101T100000Z")
    expect(ics).toContain("LOCATION:Espace Léo Ferré\\, Brest")
    expect(ics).toContain("DESCRIPTION:Ligne 1\\nLigne 2\\, avec virgule\; et point-virgule")
    expect(ics?.endsWith("END:VCALENDAR\r\n")).toBe(true)
  })
  it("plie les lignes longues", () => {
    const ics = buildAuditionIcs({
      uid: "x",
      date: "2027-01-30",
      startTime: "10:00",
      endTime: "10:10",
      summary: "S",
      description: "a".repeat(200),
      location: "L",
    })
    expect(ics?.split("\r\n").every((line) => Buffer.byteLength(line, "utf8") <= 75)).toBe(true)
  })
})
