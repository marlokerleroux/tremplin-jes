"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Menu, X, Ticket, PenLine } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { VitrineMode } from "@/lib/vitrine/modes"

export interface NavbarProps {
  mode: VitrineMode
  ticketUrl: string
  /** Lien « Je candidate » (mode auditions, inscriptions ouvertes) */
  applyUrl: string | null
  hasPalmares: boolean
  hasTour: boolean
}

function linksFor(props: NavbarProps): Array<{ href: string; label: string }> {
  switch (props.mode) {
    case "finale":
      return [
        { href: "/#a-propos", label: "La finale" },
        { href: "/#finalistes", label: "Nos finalistes" },
        { href: "/#partenaires", label: "Partenaires" },
        { href: "/a-propos", label: "À propos" },
      ]
    case "aftermath":
      return [
        { href: "/#apres-la-finale", label: "Les lauréats" },
        ...(props.hasTour ? [{ href: "/#tournee", label: "La tournée" }] : []),
        { href: "/#finalistes", label: "Les finalistes" },
        { href: "/#partenaires", label: "Partenaires" },
        { href: "/a-propos", label: "À propos" },
      ]
    case "auditions":
      return [
        { href: "/#candidater", label: "Candidater" },
        { href: "/#participer", label: "Comment ça marche" },
        ...(props.hasPalmares ? [{ href: "/#palmares", label: "Palmarès" }] : []),
        { href: "/#partenaires", label: "Partenaires" },
        { href: "/a-propos", label: "À propos" },
      ]
    default:
      return [
        { href: "/#participer", label: "Comment ça marche" },
        ...(props.hasPalmares ? [{ href: "/#palmares", label: "Palmarès" }] : []),
        { href: "/#partenaires", label: "Partenaires" },
        { href: "/a-propos", label: "À propos" },
      ]
  }
}

export function VitrineNavbar(props: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const navLinks = linksFor(props)
  const cta =
    props.mode === "finale" && props.ticketUrl ? (
      <a href={props.ticketUrl} target="_blank" rel="noopener noreferrer">
        <Ticket className="h-4 w-4 mr-1" />
        Billetterie
      </a>
    ) : props.applyUrl ? (
      <a href={props.applyUrl}>
        <PenLine className="h-4 w-4 mr-1" />
        Je candidate
      </a>
    ) : null

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-primary/10">
      <nav aria-label="Navigation principale" className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/images/design-mode/logo_sans_fond.png" alt="Tremplin Jeunes en Scène" width={180} height={54} className="h-10 w-auto" />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors">
              {link.label}
            </a>
          ))}
          {cta && (
            <Button asChild size="sm" className="bg-accent hover:bg-accent/90 text-white">
              {cta}
            </Button>
          )}
        </div>

        <button
          className="md:hidden p-2 text-foreground/70 hover:text-primary"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="md:hidden border-t bg-white px-4 py-4 space-y-3">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="block text-sm font-medium text-foreground/70 hover:text-primary py-2" onClick={() => setMobileOpen(false)}>
              {link.label}
            </a>
          ))}
          {cta && (
            <Button asChild size="sm" className="w-full bg-accent hover:bg-accent/90 text-white">
              {cta}
            </Button>
          )}
        </div>
      )}
    </header>
  )
}
