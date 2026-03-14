export interface Finalist {
  id: string
  name: string
  genre: string
  image: string
  description?: string
}

export interface Partner {
  name: string
  logo: string
  url?: string
}

export const EVENT_DATE = new Date("2026-05-13T20:00:00+02:00")
export const EVENT_VENUE = "Le Vauban"
export const EVENT_CITY = "Brest"

export const finalists: Finalist[] = [
  { id: "finaliste-1", name: "À confirmer", genre: "À confirmer", image: "/images/vitrine/finalists/placeholder.svg" },
  { id: "finaliste-2", name: "À confirmer", genre: "À confirmer", image: "/images/vitrine/finalists/placeholder.svg" },
  { id: "finaliste-3", name: "À confirmer", genre: "À confirmer", image: "/images/vitrine/finalists/placeholder.svg" },
  { id: "finaliste-4", name: "À confirmer", genre: "À confirmer", image: "/images/vitrine/finalists/placeholder.svg" },
  { id: "finaliste-5", name: "À confirmer", genre: "À confirmer", image: "/images/vitrine/finalists/placeholder.svg" },
  { id: "finaliste-6", name: "À confirmer", genre: "À confirmer", image: "/images/vitrine/finalists/placeholder.svg" },
]

export const partners: Partner[] = []

export const eventInfo = {
  ticketUrl: "#",
  passCultureUrl: "#",
}
