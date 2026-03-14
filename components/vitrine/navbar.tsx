"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Menu, X, Ticket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { eventInfo } from "@/lib/vitrine/data"

const navLinks = [
  { href: "#a-propos", label: "Le Prix" },
  { href: "#finalistes", label: "Finalistes" },
  { href: "#partenaires", label: "Partenaires" },
]

export function VitrineNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-primary/10">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/design-mode/logo_sans_fond.png"
            alt="Tremplin Jeunes en Scène"
            width={180}
            height={54}
            className="h-10 w-auto"
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors"
            >
              {link.label}
            </a>
          ))}
          <Button asChild size="sm" className="bg-accent hover:bg-accent/90 text-white">
            <a href={eventInfo.ticketUrl} target="_blank" rel="noopener noreferrer">
              <Ticket className="h-4 w-4 mr-1" />
              Billetterie
            </a>
          </Button>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 text-foreground/70 hover:text-primary"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-white px-4 py-4 space-y-3">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block text-sm font-medium text-foreground/70 hover:text-primary py-2"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <Button asChild size="sm" className="w-full bg-accent hover:bg-accent/90 text-white">
            <a href={eventInfo.ticketUrl} target="_blank" rel="noopener noreferrer">
              <Ticket className="h-4 w-4 mr-1" />
              Billetterie
            </a>
          </Button>
        </div>
      )}
    </header>
  )
}
