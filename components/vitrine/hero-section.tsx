import { CalendarDays, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CountdownTimer } from "@/components/vitrine/countdown-timer"
import { EVENT_VENUE, EVENT_CITY, eventInfo } from "@/lib/vitrine/data"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-accent min-h-[90vh] flex items-center justify-center">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-secondary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-accent/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16 text-center space-y-8">
        <div className="space-y-4">
          <p className="text-secondary font-semibold text-lg md:text-xl uppercase tracking-widest">
            Tremplin Jeunes en Scene
          </p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-white tracking-tight">
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
            className="bg-secondary text-primary hover:bg-secondary/90 font-bold text-lg px-8 py-6 rounded-full shadow-xl"
          >
            <a href={eventInfo.ticketUrl} target="_blank" rel="noopener noreferrer">
              Reserver mes places
            </a>
          </Button>
          {eventInfo.passCultureUrl !== "#" && (
            <a
              href={eventInfo.passCultureUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/80 hover:text-white text-sm underline underline-offset-4"
            >
              Disponible sur Pass Culture
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
