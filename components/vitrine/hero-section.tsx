import Image from "next/image"
import { CalendarDays, MapPin, Mic, PenLine, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CountdownTimer } from "@/components/vitrine/countdown-timer"
import { Confetti } from "@/components/vitrine/confetti"
import { TornEdge } from "@/components/vitrine/torn-edge"
import type { VitrineData } from "@/lib/vitrine/site"
import { CANDIDATE_SITE_URL } from "@/lib/vitrine/site"
import { getAuditionsPhase } from "@/lib/vitrine/modes"
import { formatDateFr, formatDateTimeFr } from "@/lib/season"
import { todayInParis } from "@/lib/reminders"

function formatFinalDate(iso: string | null): string {
  if (!iso) return "Date à venir"
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" }).format(new Date(iso))
}

function formatAuditionDates(dates: string[]): string {
  const sorted = [...dates].sort()
  if (sorted.length === 0) return "dates à venir"
  if (sorted.length === 1) return formatDateFr(sorted[0])
  return `${sorted.map((d) => formatDateFr(d, { weekday: false })).slice(0, -1).join(", ")} et ${formatDateFr(sorted[sorted.length - 1], { weekday: false })}`
}

function HeroShell({ children, confetti = false }: { children: React.ReactNode; confetti?: boolean }) {
  return (
    <section className="relative overflow-hidden min-h-[90vh] flex items-center justify-center">
      <Image src="/images/hero-tremplin.jpg" alt="" fill sizes="100vw" className="object-cover object-[32%_center] md:object-center" priority />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-purple-950/50 to-black/70" />
      {/* Mobile : le texte descend plus bas, on fonce le bas de la photo pour garder la lisibilité */}
      <div className="absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-black/80 via-black/55 to-transparent md:hidden" />
      {confetti && <Confetti />}
      <div className="relative z-10 container mx-auto px-4 py-16 text-center space-y-8">
        <Image src="/images/design-mode/logo_sans_fond.png" alt="Tremplin Jeunes en Scène" width={400} height={120} className="h-16 md:h-20 w-auto mx-auto" />
        {children}
      </div>
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <TornEdge bgColor="text-white" />
      </div>
    </section>
  )
}

function HeroTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-4xl md:text-7xl lg:text-8xl font-extrabold text-white tracking-tight uppercase" style={{ textShadow: "3px 3px 0 rgba(0,0,0,0.4)" }}>
      {children}
    </h1>
  )
}

function InfoRow({ items }: { items: Array<{ icon: React.ReactNode; text: string }> }) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-white/90">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && <div className="hidden sm:block w-px h-6 bg-white/30 mr-6" />}
          {item.icon}
          <span className="text-lg md:text-xl font-medium">{item.text}</span>
        </div>
      ))}
    </div>
  )
}

const ctaClass =
  "bg-accent text-white hover:bg-accent/90 font-extrabold text-lg px-8 py-6 rounded-none shadow-xl uppercase tracking-wider -rotate-1 hover:rotate-0 transition-transform"

export function HeroSection({ data }: { data: VitrineData }) {
  const { config, season, edition } = data
  const venueLabel = season.venue ?? ""

  if (config.mode === "finale") {
    return (
      <HeroShell confetti>
        <HeroTitle>La Finale</HeroTitle>
        <InfoRow
          items={[
            { icon: <CalendarDays className="h-5 w-5 text-secondary" />, text: formatFinalDate(edition.final_date) },
            { icon: <MapPin className="h-5 w-5 text-secondary" />, text: [edition.final_venue, edition.final_city].filter(Boolean).join(" - ") || "Lieu à venir" },
          ]}
        />
        {edition.final_date && <CountdownTimer target={edition.final_date} />}
        <div className="flex flex-col items-center justify-center gap-4 pt-4">
          {edition.ticket_url && (
            <Button asChild size="lg" className={ctaClass}>
              <a href={edition.ticket_url} target="_blank" rel="noopener noreferrer">
                Réserver mes places{edition.price_label && <span className="hidden sm:inline"> – {edition.price_label}</span>}
              </a>
            </Button>
          )}
          {edition.pass_culture_url && (
            <a
              href={edition.pass_culture_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 sm:gap-3 bg-white text-[#EB0055] hover:bg-white/90 font-bold sm:font-extrabold text-sm sm:text-base px-5 sm:px-8 py-2 sm:py-3 rounded-none shadow-lg uppercase tracking-wider rotate-1 hover:rotate-0 transition-transform"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/vitrine/pass-culture-logo.svg" alt="Pass Culture" width={100} height={30} className="h-5 sm:h-7 w-auto" />
              Réserver avec le pass
            </a>
          )}
        </div>
      </HeroShell>
    )
  }

  if (config.mode === "aftermath") {
    return (
      <HeroShell confetti>
        <p className="inline-block bg-secondary text-foreground font-extrabold text-sm uppercase tracking-widest px-4 py-1.5 -rotate-2">Édition {edition.edition}</p>
        <HeroTitle>Merci !</HeroTitle>
        <p className="text-lg md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
          {edition.jury_winner
            ? `Bravo à ${edition.jury_winner}, lauréat du prix du jury${edition.public_winner ? `, et à ${edition.public_winner}, prix du public` : ""} !`
            : "Merci à tous les finalistes, au public et aux partenaires pour cette finale."}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Button asChild size="lg" className={ctaClass}>
            <a href="#apres-la-finale">
              <Trophy className="h-5 w-5 mr-2" />
              Les lauréats
            </a>
          </Button>
          {edition.tour_dates.length > 0 && (
            <Button asChild size="lg" variant="outline" className="bg-white/10 text-white border-white/40 hover:bg-white/20 font-extrabold text-lg px-8 py-6 rounded-none uppercase tracking-wider rotate-1 hover:rotate-0 transition-transform">
              <a href="#tournee">La tournée de l&apos;été</a>
            </Button>
          )}
        </div>
      </HeroShell>
    )
  }

  if (config.mode === "auditions") {
    const phase = getAuditionsPhase(season, new Date(), todayInParis())
    const closesAt = season.registration_closes_at
    const opensAt = season.registration_opens_at
    return (
      <HeroShell>
        <p className="inline-block bg-secondary text-foreground font-extrabold text-sm uppercase tracking-widest px-4 py-1.5 -rotate-2">Édition {season.edition}</p>
        <HeroTitle>
          {phase === "open" && "Inscriptions ouvertes"}
          {phase === "not_yet_open" && "Bientôt les inscriptions"}
          {phase === "closed" && "Inscriptions closes"}
          {phase === "running" && "Les auditions"}
          {phase === "finished" && "Auditions terminées"}
        </HeroTitle>
        <p className="text-lg md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
          {phase === "open" && `Musiciennes et musiciens de 13 à 23 ans, candidatez${closesAt ? ` avant le ${formatDateTimeFr(closesAt)}` : " dès maintenant"} !`}
          {phase === "not_yet_open" && `Les inscriptions ouvrent${opensAt ? ` le ${formatDateTimeFr(opensAt)}` : " prochainement"}.`}
          {phase === "closed" && "Merci à toutes les candidates et tous les candidats. Rendez-vous aux auditions !"}
          {phase === "running" && "Les auditions battent leur plein. Bonne chance à toutes et tous !"}
          {phase === "finished" && "Le jury délibère : les six finalistes seront annoncés très bientôt."}
        </p>
        <InfoRow
          items={[
            { icon: <Mic className="h-5 w-5 text-secondary" />, text: `Auditions : ${formatAuditionDates(season.audition_dates)}` },
            ...(venueLabel ? [{ icon: <MapPin className="h-5 w-5 text-secondary" />, text: venueLabel }] : []),
          ]}
        />
        {phase === "open" && closesAt && <CountdownTimer target={closesAt} label="Clôture des inscriptions dans" />}
        {phase === "not_yet_open" && opensAt && <CountdownTimer target={opensAt} label="Ouverture des inscriptions dans" />}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          {phase === "open" && (
            <Button asChild size="lg" className={ctaClass}>
              <a href={`${CANDIDATE_SITE_URL}/auth/signup`}>
                <PenLine className="h-5 w-5 mr-2" />
                Je candidate
              </a>
            </Button>
          )}
          <Button asChild size="lg" variant="outline" className="bg-white/10 text-white border-white/40 hover:bg-white/20 font-extrabold text-lg px-8 py-6 rounded-none uppercase tracking-wider rotate-1 hover:rotate-0 transition-transform">
            <a href="#participer">Comment participer</a>
          </Button>
        </div>
      </HeroShell>
    )
  }

  // Avant-ouverture
  const opensAt = season.registration_opens_at
  return (
    <HeroShell>
      <p className="inline-block bg-secondary text-foreground font-extrabold text-sm uppercase tracking-widest px-4 py-1.5 -rotate-2">Édition {season.edition}</p>
      <HeroTitle>Bientôt de retour</HeroTitle>
      <p className="text-lg md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
        {opensAt ? `Les inscriptions ouvrent le ${formatDateTimeFr(opensAt)}.` : "Les inscriptions ouvrent prochainement."}
      </p>
      {opensAt && new Date(opensAt).getTime() > Date.now() && <CountdownTimer target={opensAt} label="Ouverture des inscriptions dans" />}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <Button asChild size="lg" className={ctaClass}>
          <a href="#participer">Comment participer</a>
        </Button>
        {data.palmares.length > 0 && (
          <Button asChild size="lg" variant="outline" className="bg-white/10 text-white border-white/40 hover:bg-white/20 font-extrabold text-lg px-8 py-6 rounded-none uppercase tracking-wider rotate-1 hover:rotate-0 transition-transform">
            <a href="#palmares">Le palmarès {data.palmares[0].edition}</a>
          </Button>
        )}
      </div>
    </HeroShell>
  )
}
