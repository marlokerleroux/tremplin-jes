import { Calendar, Mic, Star, Trophy } from "lucide-react"
import { TornEdge } from "@/components/vitrine/torn-edge"
import type { SeasonConfigDTO } from "@/lib/season-config"
import { formatDateFr, formatDateTimeFr } from "@/lib/season"

function registrationLabel(season: SeasonConfigDTO): string {
  const opens = season.registration_opens_at ? formatDateTimeFr(season.registration_opens_at) : null
  const closes = season.registration_closes_at ? formatDateTimeFr(season.registration_closes_at) : null
  if (opens && closes) return `Du ${opens} au ${closes}, inscrivez-vous en ligne depuis l'espace candidat : c'est gratuit.`
  if (closes) return `Jusqu'au ${closes}, inscrivez-vous en ligne depuis l'espace candidat : c'est gratuit.`
  if (opens) return `À partir du ${opens}, inscrivez-vous en ligne depuis l'espace candidat : c'est gratuit.`
  return "Inscrivez-vous en ligne depuis l'espace candidat : c'est gratuit."
}

function auditionsLabel(season: SeasonConfigDTO): string {
  const dates = [...season.audition_dates].sort()
  const where = season.venue ? ` ${season.venue.startsWith("Espace") ? "à l'" : "à "}${season.venue}` : ""
  if (dates.length === 0) return `Tous les candidats passent en live devant le jury${where}. Six formations sont sélectionnées pour la finale.`
  return `Tous les candidats passent en live devant le jury${where}, le ${dates.map((d) => formatDateFr(d)).join(" et le ")}. Six formations sont sélectionnées pour la finale.`
}

/** Les étapes du tremplin (modes avant-ouverture et auditions). */
export function HowItWorksSection({ season, tornTo = "text-white" }: { season: SeasonConfigDTO; tornTo?: string }) {
  const steps = [
    { icon: <Calendar className="h-6 w-6 text-primary shrink-0" />, title: "Les inscriptions", text: registrationLabel(season), border: "border-primary" },
    { icon: <Mic className="h-6 w-6 text-primary shrink-0" />, title: "Les auditions", text: auditionsLabel(season), border: "border-primary" },
    {
      icon: <Star className="h-6 w-6 text-accent shrink-0" />,
      title: "La pré-production",
      text: "Un accompagnement artistique est offert aux six finalistes : technique vocale, présence scénique, direction artistique.",
      border: "border-accent",
    },
    {
      icon: <Trophy className="h-6 w-6 text-accent shrink-0" />,
      title: "La finale",
      text: `Les six finalistes s'affrontent sur scène à Brest au printemps ${season.edition}. Le jury décerne le prix du jury, le public son prix du public.`,
      border: "border-accent",
    },
  ]
  return (
    <section id="participer" className="relative scroll-mt-20 py-20 md:py-28 bg-primary/5">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <h2 className="text-3xl md:text-5xl font-extrabold text-primary uppercase text-center">Comment ça marche ?</h2>
          <p className="text-lg text-foreground/70 leading-relaxed text-center max-w-3xl mx-auto">
            Jeunes en Scène est un tremplin musical gratuit pour les artistes de 13 à 23 ans résidant en Bretagne, ouvert à tous les genres
            musicaux, en solo ou en groupe.
          </p>
          <div className="grid md:grid-cols-2 gap-6 pt-4">
            {steps.map((step) => (
              <div key={step.title} className={`bg-white p-6 space-y-3 border-l-4 ${step.border} shadow-sm`}>
                <div className="flex items-center gap-3">
                  {step.icon}
                  <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
                </div>
                <p className="text-foreground/60 leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0">
        <TornEdge bgColor={tornTo} />
      </div>
    </section>
  )
}
