import { describe, expect, it } from "vitest"
import { extractYoutubeId, getAuditionsPhase, normalizeFinalists, normalizeTourDates } from "./modes"

const season = {
  edition: 2027,
  registration_opens_at: "2026-10-15T00:00:00Z",
  registration_closes_at: "2026-12-31T23:00:00Z",
  audition_dates: ["2027-01-30", "2027-01-31"],
  age_reference_date: null,
}

describe("getAuditionsPhase", () => {
  it("suit les dates de la saison", () => {
    expect(getAuditionsPhase(season, new Date("2026-10-01T00:00:00Z"), "2026-10-01")).toBe("not_yet_open")
    expect(getAuditionsPhase(season, new Date("2026-11-01T00:00:00Z"), "2026-11-01")).toBe("open")
    expect(getAuditionsPhase(season, new Date("2027-01-10T00:00:00Z"), "2027-01-10")).toBe("closed")
    expect(getAuditionsPhase(season, new Date("2027-01-30T10:00:00Z"), "2027-01-30")).toBe("running")
    expect(getAuditionsPhase(season, new Date("2027-02-02T10:00:00Z"), "2027-02-02")).toBe("finished")
  })
  it("reste « closes » sans date d'audition", () => {
    expect(getAuditionsPhase({ ...season, audition_dates: [] }, new Date("2027-02-02T10:00:00Z"), "2027-02-02")).toBe("closed")
  })
})

describe("normalizeFinalists", () => {
  it("ignore les entrées invalides et complète les champs", () => {
    expect(normalizeFinalists([{ name: "Starfish", genre: "Rock" }, { genre: "sans nom" }, "x"])).toEqual([
      { id: "finaliste-1", name: "Starfish", genre: "Rock", description: "", image: "", youtubeId: "" },
    ])
  })
})

describe("normalizeTourDates", () => {
  it("trie par date", () => {
    expect(normalizeTourDates([{ date: "2026-08-01", name: "B" }, { date: "2026-07-01", name: "A" }]).map((d) => d.name)).toEqual(["A", "B"])
  })
})

describe("extractYoutubeId", () => {
  it("accepte une URL ou un identifiant", () => {
    expect(extractYoutubeId("https://www.youtube.com/watch?v=t-jooYuxiWI")).toBe("t-jooYuxiWI")
    expect(extractYoutubeId("https://youtu.be/zV89QknrueM?si=abc")).toBe("zV89QknrueM")
    expect(extractYoutubeId("oSQmIJJOBIg")).toBe("oSQmIJJOBIg")
    expect(extractYoutubeId("pas une vidéo !")).toBe("")
  })
})
