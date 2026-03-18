import type React from "react"
import type { Metadata } from "next"
import { VitrineNavbar } from "@/components/vitrine/navbar"
import { VitrineFooter } from "@/components/vitrine/vitrine-footer"

export const metadata: Metadata = {
  title: {
    default: "Tremplin Jeunes en Scène - Finale 2026",
    template: "%s | Tremplin Jeunes en Scène",
  },
  description:
    "La finale du Tremplin Jeunes en Scène, le tremplin musical breton pour les jeunes de 13 à 23 ans. Le 13 mai 2026 au Vauban à Brest.",
  keywords: [
    "tremplin musical",
    "jeunes musiciens",
    "Brest",
    "Bretagne",
    "tremplin musique",
    "Pass'Musique",
    "Vauban",
    "13-23 ans",
    "finale 2026",
    "concert Brest",
  ],
  authors: [{ name: "Association Pass'Musique" }],
  metadataBase: new URL("https://tremplin-jeunes-en-scene.fr"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Tremplin Jeunes en Scène - Finale 2026",
    description:
      "6 finalistes, 1 seul lauréat ! Rendez-vous le 13 mai 2026 au Vauban à Brest.",
    type: "website",
    locale: "fr_FR",
    siteName: "Tremplin Jeunes en Scène",
    images: [{ url: "/images/hero-concert.jpg", width: 1920, height: 1920, alt: "Tremplin Jeunes en Scène - Concert" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tremplin Jeunes en Scène - Finale 2026",
    description:
      "6 finalistes, 1 seul lauréat ! Rendez-vous le 13 mai 2026 au Vauban à Brest.",
    images: ["/images/hero-concert.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "MusicEvent",
  name: "Tremplin Jeunes en Scène - Finale 2026",
  description:
    "La finale du Tremplin Jeunes en Scène, tremplin musical breton pour les jeunes artistes de 13 à 23 ans.",
  startDate: "2026-05-13T20:00:00+02:00",
  endDate: "2026-05-13T23:00:00+02:00",
  eventStatus: "https://schema.org/EventScheduled",
  eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  location: {
    "@type": "Place",
    name: "Le Vauban",
    address: {
      "@type": "PostalAddress",
      streetAddress: "17 Avenue Georges Clemenceau",
      addressLocality: "Brest",
      postalCode: "29200",
      addressCountry: "FR",
    },
  },
  organizer: {
    "@type": "Organization",
    name: "Association Pass'Musique",
    url: "https://tremplin-jeunes-en-scene.fr",
  },
  offers: {
    "@type": "Offer",
    url: "https://www.billetweb.fr/finale-tremplin-jeunes-en-scene-2026",
    price: "7",
    priceCurrency: "EUR",
    availability: "https://schema.org/InStock",
  },
  image: "https://tremplin-jeunes-en-scene.fr/images/hero-concert.jpg",
}

export default function VitrineLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <VitrineNavbar />
      <main>{children}</main>
      <VitrineFooter />
    </>
  )
}
