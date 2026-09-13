import { describe, expect, it } from "vitest"
import { daysUntil, dueReminders, todayInParis } from "./reminders"

const none = { reminder_j7_sent_at: null, reminder_j1_sent_at: null }

describe("daysUntil", () => {
  it("compte les jours calendaires", () => {
    expect(daysUntil("2027-01-30", "2027-01-23")).toBe(7)
    expect(daysUntil("2027-01-30", "2027-01-30")).toBe(0)
    expect(daysUntil("2027-01-30", "2027-02-01")).toBe(-2)
    expect(daysUntil("bad", "2027-02-01")).toBeNull()
  })
})

describe("dueReminders", () => {
  it("J-7 dans une fenêtre de 5 à 7 jours, J-1 uniquement la veille", () => {
    expect(dueReminders("2027-01-30", "2027-01-23", none)).toEqual(["j7"])
    expect(dueReminders("2027-01-30", "2027-01-25", none)).toEqual(["j7"])
    expect(dueReminders("2027-01-30", "2027-01-24", none)).toEqual(["j7"])
    expect(dueReminders("2027-01-30", "2027-01-26", none)).toEqual([])
    expect(dueReminders("2027-01-30", "2027-01-29", none)).toEqual(["j1"])
    expect(dueReminders("2027-01-30", "2027-01-30", none)).toEqual([])
    expect(dueReminders("2027-01-30", "2027-01-31", none)).toEqual([])
  })
  it("ne renvoie pas un rappel déjà envoyé", () => {
    expect(dueReminders("2027-01-30", "2027-01-23", { reminder_j7_sent_at: new Date(), reminder_j1_sent_at: null })).toEqual([])
    expect(dueReminders("2027-01-30", "2027-01-29", { reminder_j7_sent_at: null, reminder_j1_sent_at: "2027-01-29T08:00:00Z" })).toEqual([])
  })
})

describe("todayInParis", () => {
  it("bascule de jour à minuit heure de Paris", () => {
    expect(todayInParis(new Date("2027-01-29T23:30:00Z"))).toBe("2027-01-30")
    expect(todayInParis(new Date("2027-06-30T22:30:00Z"))).toBe("2027-07-01")
    expect(todayInParis(new Date("2027-06-30T21:30:00Z"))).toBe("2027-06-30")
  })
})
