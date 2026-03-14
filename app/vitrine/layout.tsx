import type React from "react"
import type { Metadata } from "next"
import { VitrineNavbar } from "@/components/vitrine/navbar"
import { VitrineFooter } from "@/components/vitrine/vitrine-footer"

export const metadata: Metadata = {
  title: "Tremplin Jeunes en Scène - Finale 2026",
  description:
    "La finale du Tremplin Jeunes en Scène, le tremplin musical breton pour les jeunes de 13 à 23 ans. Le 13 mai 2026 au Vauban à Brest.",
  openGraph: {
    title: "Tremplin Jeunes en Scène - Finale 2026",
    description:
      "6 finalistes, 1 seul lauréat ! Rendez-vous le 13 mai 2026 au Vauban à Brest.",
    type: "website",
  },
}

export default function VitrineLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <VitrineNavbar />
      <main>{children}</main>
      <VitrineFooter />
    </>
  )
}
