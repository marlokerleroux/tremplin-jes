"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { X } from "lucide-react"

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent")
    if (!consent) {
      setShowBanner(true)
    }
  }, [])

  const acceptCookies = () => {
    localStorage.setItem("cookie-consent", "accepted")
    setShowBanner(false)
  }

  const rejectCookies = () => {
    localStorage.setItem("cookie-consent", "rejected")
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-black/50 backdrop-blur-sm">
      <Card className="max-w-4xl mx-auto p-6">
        <div className="flex items-start gap-4">
          <div className="flex-1 space-y-3">
            <h3 className="font-semibold text-lg">Cookies et confidentialité</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Ce site utilise des <strong>cookies techniques</strong> (authentification, session) strictement
              nécessaires à son fonctionnement. Vous pouvez accepter ou refuser les cookies optionnels.{" "}
              <Link href="/privacy" className="text-primary underline hover:text-primary/80">
                En savoir plus
              </Link>
            </p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={acceptCookies} size="sm">
                Accepter
              </Button>
              <Button onClick={rejectCookies} variant="outline" size="sm">
                Refuser
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/privacy">Politique de confidentialité</Link>
              </Button>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={rejectCookies} className="shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  )
}
