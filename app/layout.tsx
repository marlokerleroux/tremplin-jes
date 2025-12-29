import type React from "react"
import type { Metadata } from "next"
import { Montserrat, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Suspense } from "react"
import { CookieConsentBanner } from "@/components/cookie-consent-banner"

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Tremplin Jeunes en Scène - Inscription",
  description: "Plateforme d'inscription pour le tremplin musical breton destiné aux jeunes musiciens de 13 à 23 ans",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <body className={`font-sans ${montserrat.variable} ${geistMono.variable}`}>
        <Suspense fallback={null}>{children}</Suspense>
        <Analytics />
        <CookieConsentBanner />
      </body>
    </html>
  )
}
