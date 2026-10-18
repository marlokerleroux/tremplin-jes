import type React from "react"
import type { Metadata } from "next"
import { getVitrineData, VITRINE_SITE_URL, type VitrineData } from "@/lib/vitrine/site"
import { VitrineFooter, VitrineHeader } from "@/components/vitrine/vitrine-site"
import { VitrineChatbot } from "@/components/vitrine/chatbot"

export const dynamic = "force-dynamic"

function finalDateLabel(iso: string | null): string {
  if (!iso) return ""
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" }).format(new Date(iso))
}

function metadataFor(data: VitrineData): { title: string; description: string } {
  const { config, edition, season } = data
  const place = [edition.final_venue, edition.final_city].filter(Boolean).join(" à ")
  switch (config.mode) {
    case "finale":
      return {
        title: `Tremplin Jeunes en Scène - Finale ${edition.edition}`,
        description: `La finale du Tremplin Jeunes en Scène, le tremplin musical breton pour les jeunes de 13 à 23 ans.${edition.final_date ? ` Le ${finalDateLabel(edition.final_date)}` : ""}${place ? ` ${place.startsWith("Le ") ? "au" : "à"} ${place.replace(/^Le /, "")}` : ""}.`,
      }
    case "aftermath":
      return {
        title: `Tremplin Jeunes en Scène - Lauréats ${edition.edition}`,
        description: `${edition.jury_winner ? `${edition.jury_winner} remporte le prix du jury` : "Les lauréats"} de la finale ${edition.edition} du Tremplin Jeunes en Scène, tremplin musical breton pour les 13-23 ans.`,
      }
    case "auditions":
      return {
        title: `Tremplin Jeunes en Scène - Inscriptions ${season.edition}`,
        description: "Tremplin musical gratuit pour les jeunes de 13 à 23 ans en Bretagne : candidatez en ligne et passez en live devant un jury de professionnels à Brest.",
      }
    default:
      return {
        title: `Tremplin Jeunes en Scène - Édition ${season.edition}`,
        description: "Le tremplin musical breton pour les jeunes de 13 à 23 ans revient : inscriptions, auditions à Brest et finale au printemps.",
      }
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const data = await getVitrineData()
  const { title, description } = metadataFor(data)
  return {
    title: { default: title, template: "%s | Tremplin Jeunes en Scène" },
    description,
    keywords: ["tremplin musical", "jeunes musiciens", "Brest", "Bretagne", "tremplin musique", "Pass'Musique", "13-23 ans", "concert Brest"],
    authors: [{ name: "Association Pass'Musique" }],
    metadataBase: new URL("https://tremplin-jeunes-en-scene.fr"),
    alternates: { canonical: "/" },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "fr_FR",
      siteName: "Tremplin Jeunes en Scène",
      images: [{ url: "/images/hero-concert.jpg", width: 1920, height: 1920, alt: "Tremplin Jeunes en Scène - Concert" }],
    },
    twitter: { card: "summary_large_image", title, description, images: ["/images/hero-concert.jpg"] },
    robots: { index: true, follow: true },
  }
}

function eventJsonLd(data: VitrineData): Record<string, unknown> | null {
  const { config, edition } = data
  if (config.mode !== "finale" || !edition.final_date) return null
  const start = new Date(edition.final_date)
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000)
  const priceMatch = edition.price_label ? /(\d+(?:[.,]\d+)?)/.exec(edition.price_label) : null
  return {
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    name: `Tremplin Jeunes en Scène - Finale ${edition.edition}`,
    description: "La finale du Tremplin Jeunes en Scène, tremplin musical breton pour les jeunes artistes de 13 à 23 ans.",
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: edition.final_venue || "Brest",
      address: { "@type": "PostalAddress", streetAddress: edition.final_address || undefined, addressLocality: edition.final_city || "Brest", addressCountry: "FR" },
    },
    organizer: { "@type": "Organization", name: "Association Pass'Musique", url: VITRINE_SITE_URL },
    ...(edition.ticket_url
      ? {
          offers: {
            "@type": "Offer",
            url: edition.ticket_url,
            ...(priceMatch ? { price: priceMatch[1].replace(",", "."), priceCurrency: "EUR" } : {}),
            availability: "https://schema.org/InStock",
          },
        }
      : {}),
    image: `${VITRINE_SITE_URL}/images/hero-concert.jpg`,
  }
}

export default async function VitrineLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const data = await getVitrineData()
  const jsonLd = eventJsonLd(data)
  return (
    // Textes libres saisis dans l'administration : toute chaîne trop longue peut être coupée (pas de débordement mobile).
    <div className="min-w-0 [overflow-wrap:anywhere]">
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />}
      <VitrineHeader data={data} />
      <main>{children}</main>
      <VitrineFooter />
      <VitrineChatbot />
    </div>
  )
}
