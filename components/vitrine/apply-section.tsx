import { CheckCircle2, FileText, PenLine, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TornEdge } from "@/components/vitrine/torn-edge"
import type { VitrineData } from "@/lib/vitrine/site"
import { CANDIDATE_SITE_URL, DEFAULT_AUDITIONS_INTRO } from "@/lib/vitrine/site"
import { getAuditionsPhase } from "@/lib/vitrine/modes"
import { todayInParis } from "@/lib/reminders"
import { formatDateShortFr, getAgeReferenceDate } from "@/lib/season"

/** Mode auditions : le site explique comment candidater et renvoie vers l'espace candidat. */
export function ApplySection({ data }: { data: VitrineData }) {
  const { season, config } = data
  const phase = getAuditionsPhase(season, new Date(), todayInParis())
  const refDate = formatDateShortFr(getAgeReferenceDate(season))
  const conditions = [
    `Avoir entre 13 et 23 ans au ${refDate} (en groupe : chaque membre entre 13 et 25 ans, moyenne d'âge de 23 ans maximum)`,
    "Résider en Bretagne (Côtes-d'Armor, Finistère, Ille-et-Vilaine ou Morbihan)",
    "Présenter un répertoire en live, tous styles bienvenus, reprises ou compositions",
    "Pour les mineurs : une autorisation parentale signée",
  ]
  const steps = [
    { icon: <PenLine className="h-6 w-6 text-primary" />, title: "1. Créez votre compte", text: "Sur l'espace candidat, avec une adresse email valide : vous y recevrez votre convocation." },
    { icon: <Users className="h-6 w-6 text-primary" />, title: "2. Remplissez votre candidature", text: "Nom de scène, membres du groupe, style, biographie et date d'audition souhaitée." },
    { icon: <FileText className="h-6 w-6 text-primary" />, title: "3. Envoyez vos documents", text: "Votre fiche technique (PDF) et, pour les mineurs, l'autorisation parentale. Des modèles sont fournis." },
    { icon: <CheckCircle2 className="h-6 w-6 text-primary" />, title: "4. Recevez votre convocation", text: "Une fois le dossier validé, vous recevez la date et l'heure de votre passage devant le jury." },
  ]
  return (
    <section id="candidater" className="relative scroll-mt-20 py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-5xl font-extrabold text-primary uppercase">Candidater</h2>
            <p className="text-lg text-foreground/70 leading-relaxed max-w-3xl mx-auto whitespace-pre-line">{config.auditions_intro || DEFAULT_AUDITIONS_INTRO}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-primary/5 p-8 space-y-4 border-2 border-primary/10">
              <h3 className="text-xl font-bold text-foreground">Les conditions</h3>
              <ul className="space-y-3">
                {conditions.map((condition) => (
                  <li key={condition} className="flex items-start gap-3 text-foreground/70 leading-relaxed">
                    <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                    <span>{condition}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              {steps.map((step) => (
                <div key={step.title} className="flex items-start gap-4 bg-white p-5 shadow-sm border-2 border-foreground/10">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">{step.icon}</div>
                  <div>
                    <h4 className="font-bold text-foreground">{step.title}</h4>
                    <p className="text-foreground/60 text-sm leading-relaxed">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center space-y-3">
            {phase === "open" ? (
              <Button asChild size="lg" className="bg-accent text-white hover:bg-accent/90 font-extrabold text-lg px-8 py-6 rounded-none shadow-xl uppercase tracking-wider -rotate-1 hover:rotate-0 transition-transform">
                <a href={`${CANDIDATE_SITE_URL}/auth/signup`}>
                  <PenLine className="h-5 w-5 mr-2" />
                  Je candidate
                </a>
              </Button>
            ) : (
              <p className="text-foreground/60">
                {phase === "not_yet_open" ? "Les inscriptions ne sont pas encore ouvertes." : "Les inscriptions sont closes pour cette édition."}{" "}
                Vous avez déjà un compte ?{" "}
                <a href={`${CANDIDATE_SITE_URL}/auth/login`} className="text-primary underline underline-offset-4">
                  Accéder à mon espace candidat
                </a>
              </p>
            )}
            {phase === "open" && (
              <p className="text-sm text-foreground/60">
                Déjà inscrit ?{" "}
                <a href={`${CANDIDATE_SITE_URL}/auth/login`} className="text-primary underline underline-offset-4">
                  Accéder à mon espace candidat
                </a>
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0">
        <TornEdge bgColor="text-[oklch(0.97_0.01_264)]" />
      </div>
    </section>
  )
}
