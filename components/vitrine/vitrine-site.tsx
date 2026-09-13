import type { VitrineData } from "@/lib/vitrine/site"
import { CANDIDATE_SITE_URL } from "@/lib/vitrine/site"
import { getAuditionsPhase } from "@/lib/vitrine/modes"
import { todayInParis } from "@/lib/reminders"
import { AnnouncementBanner } from "@/components/vitrine/announcement-banner"
import { VitrineNavbar } from "@/components/vitrine/navbar"
import { VitrineFooter } from "@/components/vitrine/vitrine-footer"
import { HeroSection } from "@/components/vitrine/hero-section"
import { AboutSection } from "@/components/vitrine/about-section"
import { HowItWorksSection } from "@/components/vitrine/how-it-works-section"
import { ApplySection } from "@/components/vitrine/apply-section"
import { FinalistsSection } from "@/components/vitrine/finalists-section"
import { PalmaresSection } from "@/components/vitrine/palmares-section"
import { AftermathSection } from "@/components/vitrine/aftermath-section"
import { PartnersSection } from "@/components/vitrine/partners-section"

/** Page d'accueil du site vitrine, composée selon le mode. */
export function VitrineHome({ data }: { data: VitrineData }) {
  const { config, edition, season, palmares, partners } = data
  switch (config.mode) {
    case "finale":
      return (
        <>
          <HeroSection data={data} />
          <AboutSection edition={edition} />
          <FinalistsSection edition={edition} />
          <PartnersSection partners={partners} />
        </>
      )
    case "aftermath":
      return (
        <>
          <HeroSection data={data} />
          <AftermathSection edition={edition} />
          <FinalistsSection edition={edition} retrospective />
          <PartnersSection partners={partners} />
        </>
      )
    case "auditions":
      return (
        <>
          <HeroSection data={data} />
          <ApplySection data={data} />
          <HowItWorksSection season={season} tornTo={palmares.length > 0 ? "text-white" : "text-[oklch(0.97_0.01_264)]"} />
          <PalmaresSection editions={palmares} />
          <PartnersSection partners={partners} />
        </>
      )
    default:
      return (
        <>
          <HeroSection data={data} />
          <HowItWorksSection season={season} tornTo={palmares.length > 0 ? "text-white" : "text-[oklch(0.97_0.01_264)]"} />
          <PalmaresSection editions={palmares} />
          <PartnersSection partners={partners} />
        </>
      )
  }
}

/** Barre de navigation et bandeau, pilotés par les données. */
export function VitrineHeader({ data }: { data: VitrineData }) {
  const { config, edition, season, palmares } = data
  const applyUrl = config.mode === "auditions" && getAuditionsPhase(season, new Date(), todayInParis()) === "open" ? `${CANDIDATE_SITE_URL}/auth/signup` : null
  return (
    <>
      {config.banner_enabled && config.banner_text && <AnnouncementBanner text={config.banner_text} url={config.banner_url} />}
      <VitrineNavbar mode={config.mode} ticketUrl={edition.ticket_url} applyUrl={applyUrl} hasPalmares={palmares.length > 0} hasTour={edition.tour_dates.length > 0} />
    </>
  )
}

export { VitrineFooter }
