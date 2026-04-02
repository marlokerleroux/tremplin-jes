import Image from "next/image"
import { CalendarDays, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CountdownTimer } from "@/components/vitrine/countdown-timer"
import { Confetti } from "@/components/vitrine/confetti"
import { TornEdge } from "@/components/vitrine/torn-edge"
import { EVENT_VENUE, EVENT_CITY, eventInfo } from "@/lib/vitrine/data"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden min-h-[90vh] flex items-center justify-center">
      {/* Background image */}
      <Image
        src="/images/hero-concert.jpg"
        alt=""
        fill
        sizes="100vw"
        className="object-cover"
        priority
      />
      {/* Dark overlay with slight purple tint */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-purple-950/50 to-black/70" />

      {/* Confetti */}
      <Confetti />

      <div className="relative z-10 container mx-auto px-4 py-16 text-center space-y-8">
        <div className="space-y-4">
          <Image
            src="/images/design-mode/logo_sans_fond.png"
            alt="Tremplin Jeunes en Scène"
            width={400}
            height={120}
            className="h-16 md:h-20 w-auto mx-auto"
          />
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-white tracking-tight uppercase" style={{ textShadow: "3px 3px 0 rgba(0,0,0,0.4)" }}>
            La Finale
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-white/90">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-secondary" />
            <span className="text-lg md:text-xl font-medium">13 mai 2026</span>
          </div>
          <div className="hidden sm:block w-px h-6 bg-white/30" />
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-secondary" />
            <span className="text-lg md:text-xl font-medium">{EVENT_VENUE} - {EVENT_CITY}</span>
          </div>
        </div>

        <CountdownTimer />

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Button
            asChild
            size="lg"
            className="bg-accent text-white hover:bg-accent/90 font-extrabold text-lg px-8 py-6 rounded-none shadow-xl uppercase tracking-wider -rotate-1 hover:rotate-0 transition-transform"
          >
            <a href={eventInfo.ticketUrl} target="_blank" rel="noopener noreferrer">
              Réserver mes places<span className="hidden sm:inline"> – à partir de 7€</span>
            </a>
          </Button>
          {eventInfo.passCultureUrl !== "#" && (
            <a
              href={eventInfo.passCultureUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-white text-[#EB0055] hover:bg-white/90 font-extrabold text-lg px-8 py-3 rounded-none shadow-xl uppercase tracking-wider rotate-1 hover:rotate-0 transition-transform"
            >
              <Image
                src="/images/vitrine/pass-culture-logo.svg"
                alt="Pass Culture"
                width={100}
                height={30}
                className="h-7 w-auto"
              />
              Réserver avec le pass
            </a>
          )}
        </div>
      </div>

      {/* Torn edge into about section */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <TornEdge bgColor="text-[oklch(0.97_0.01_264)]" />
      </div>
    </section>
  )
}
