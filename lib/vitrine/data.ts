export interface Finalist {
  id: string
  name: string
  genre: string
  image: string
  description?: string
  youtubeId?: string
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
  { id: "finaliste-1", name: "Mayti", genre: "Rap", image: "/images/vitrine/finalists/mayti.jpg", youtubeId: "t-jooYuxiWI", description: "Rappeur de 17 ans originaire de la région lorientaise, il a créé un univers reposant sur une écriture sincère, teintée d'émotions brutes, de doutes, de réflexions personnelles et d'une lucidité étonnante." },
  { id: "finaliste-2", name: "Cyel", genre: "Pop / Rock", image: "/images/vitrine/finalists/cyel.jpg", youtubeId: "zV89QknrueM", description: "Le groupe évolue dans des compositions principalement en français et nourries par des influences variées des membres du groupe. Sur scène, leur but est de s'amuser tout en communiquant leur énergie et leur passion." },
  { id: "finaliste-3", name: "Vantage", genre: "Pop / Punk / Rock", image: "/images/vitrine/finalists/vantage.jpeg", youtubeId: "oSQmIJJOBIg", description: "C'est avant tout une bande de potes entre répètes et virées à la boulangerie, à l'énergie sincère et un peu bordélique. Dans son dernier EP, le groupe aborde des thèmes aussi variés que les relations, les regrets, le monde virtuel..." },
  { id: "finaliste-4", name: "Al!ce", genre: "Pop / Rock", image: "/images/vitrine/finalists/alice.jpg", youtubeId: "XdtLJXi9a2s", description: "Il nous emporte dans un voyage énergique entre pop, rock, rap, et électro, évoquant les ruptures amoureuses et amicales, ses failles, mais aussi des sujets plus engagés comme la montée des extrêmes ou l'abus de pouvoir." },
  { id: "finaliste-5", name: "Lilly Jane", genre: "Pop / Folk", image: "/images/vitrine/finalists/lillyjane.jpg", youtubeId: "O5gljF3_z8M", description: "Autrice-compositrice-interprète de 18 ans, elle se distingue par un univers pop-folk aux touches jazzy. Au piano comme à la guitare, elle interprète des chansons sincères, où se mêlent émotions et instants de vie." },
  { id: "finaliste-6", name: "Starfish", genre: "Pop / Rock Alternatif", image: "/images/vitrine/finalists/starfish.jpg", youtubeId: "uwRgnE-Cogg", description: "Jeune groupe de rock alternatif brestois, leur plus grande force est certainement leur énergie sur scène, celle-ci étant un lieu d'expression et de libération. Ils font de chaque concert un moment unique de partage avec le public." },
]

export const partners: Partner[] = [
  { name: "Festidreuz", logo: "/images/vitrine/partners/festidreuz.jpg", url: "https://www.festidreuz.fr" },
  { name: "Ouestival", logo: "/images/vitrine/partners/ouestival.jpg", url: "https://ouestival29.fr" },
  { name: "Nuit des Étoiles", logo: "/images/vitrine/partners/nuit-des-etoiles.png", url: "https://www.festival-nuitdesetoiles.fr" },
  { name: "Les Ribamboules", logo: "/images/vitrine/partners/ribamboules.png", url: "https://lesribamboules.bzh/" },
  { name: "Sea Fest N Sound", logo: "/images/vitrine/partners/sea-fest-n-sound.png", url: "https://www.seafestnsound.fr" },
  { name: "Espace Léo Ferré", logo: "/images/vitrine/partners/espace-leo-ferre.jpg", url: "https://espaceleoferre.e-monsite.com" },
  { name: "Crédit Agricole", logo: "/images/vitrine/partners/credit-agricole.png", url: "https://www.credit-agricole.fr/ca-finistere/particulier.html" },
  { name: "Brest", logo: "/images/vitrine/partners/brest.png", url: "https://brest.fr" },
  { name: "Le Relecq-Kerhuon", logo: "/images/vitrine/partners/relecq-kerhuon.jpg", url: "https://www.lerelecqkerhuon.bzh" },
  { name: "Bibus", logo: "/images/vitrine/partners/bibus.png", url: "https://www.bibus.fr" },
  { name: "Intermarché", logo: "/images/vitrine/partners/intermarche.png", url: "https://www.intermarche.com/magasins/09641/brest-29200/infos-pratiques" },
  { name: "Mercier Musique", logo: "/images/vitrine/partners/mercier-musique.png", url: "https://merciermusique.com" },
  { name: "BDB Studio", logo: "/images/vitrine/partners/bdb-studio.png", url: "https://www.instagram.com/studio_bdb/" },
  { name: "KVS Studio", logo: "/images/vitrine/partners/kvs-studio.webp", url: "https://kvsstudio.odoo.com" },
  { name: "Hot Pizza", logo: "/images/vitrine/partners/hot-pizza.png", url: "https://www.hotpizza-brest.fr/pizzeria-et-pizza-a-emporter-brest.html" },
  { name: "Seems Fair Studio", logo: "/images/vitrine/partners/seems-fair-studio.png", url: "https://www.instagram.com/seemsfairstudio/" },
]

export const eventInfo = {
  ticketUrl: "https://www.billetweb.fr/finale-tremplin-jeunes-en-scene-2026",
  passCultureUrl: "https://passculture.app/offre/399633296",
}
