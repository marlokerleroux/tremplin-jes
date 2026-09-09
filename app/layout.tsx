import type React from "react"
import type { Metadata } from "next"
import { Montserrat, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Suspense } from "react"
import { Toaster } from "sonner"
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
  title: "Tremplin Jeunes en Scène",
  description: "Tremplin musical breton destiné aux jeunes musiciens de 13 à 23 ans",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className="scroll-smooth">
      <body className={`font-sans ${montserrat.variable} ${geistMono.variable}`}>
        <Suspense fallback={null}>{children}</Suspense>
        <CookieConsentBanner />
        <Toaster richColors closeButton position="top-right" />
      </body>
    </html>
  )
}
