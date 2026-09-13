import { Trophy, Camera, Music } from "lucide-react"
import { TornEdge } from "@/components/vitrine/torn-edge"
import type { VitrineEditionDTO } from "@/lib/vitrine/site"

function formatFinalDate(iso: string | null): string | null {
  if (!iso) return null
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" }).format(new Date(iso))
}

/** Section « la finale » (mode finale) : prix et présentation, pilotés par l'édition. */
export function AboutSection({ edition }: { edition: VitrineEditionDTO }) {
  const count = edition.finalists.length || 6
  const date = formatFinalDate(edition.final_date)
  const place = [edition.final_venue, edition.final_city].filter(Boolean).join(" à ")
  return (
    <section id="a-propos" className="relative scroll-mt-20 py-20 md:py-28 bg-primary/5">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6 mb-16">
          {edition.anniversary_label && (
            <p className="inline-block bg-accent/10 text-accent font-extrabold text-sm uppercase tracking-widest px-4 py-1.5 -rotate-2">
              {edition.anniversary_label}
            </p>
          )}
          <h2 className="text-3xl md:text-5xl font-extrabold text-primary uppercase">
            {count} finalistes,
            <br />1 seul lauréat !
          </h2>
          <p className="text-lg md:text-xl text-foreground/70 leading-relaxed">
            Le Tremplin Jeunes en Scène révèle les talents musicaux bretons de 13 à 23 ans. Pour l&apos;édition {edition.edition}, {count}{" "}
            finalistes s&apos;affronteront{place ? ` sur la scène ${place.startsWith("Le ") || place.startsWith("La ") ? "de " : "de "}${place}` : ""}
            {date ? ` le ${date}` : ""}.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white rounded-none p-8 shadow-md text-center space-y-4 border-2 border-foreground/10">
            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto">
              <Music className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Le Tremplin</h3>
            <p className="text-foreground/60 leading-relaxed">
              Un concert ouvert à tous les styles musicaux. Les {count} finalistes se produisent devant un jury de professionnels et le public.
            </p>
          </div>

          <div className="bg-white rounded-none p-8 shadow-md text-center space-y-4 border-2 border-foreground/10">
            <div className="w-14 h-14 bg-secondary/20 rounded-xl flex items-center justify-center mx-auto">
              <Trophy className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Prix du Jury</h3>
            <p className="text-foreground/60 leading-relaxed">{edition.jury_prize_text || "Le jury désigne le grand vainqueur de la soirée."}</p>
          </div>

          <div className="bg-white rounded-none p-8 shadow-md text-center space-y-4 border-2 border-foreground/10">
            <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center mx-auto">
              <Camera className="h-7 w-7 text-accent" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Prix du Public</h3>
            <p className="text-foreground/60 leading-relaxed">{edition.public_prize_text || "Le public vote pour son artiste préféré !"}</p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0">
        <TornEdge bgColor="text-white" />
      </div>
    </section>
  )
}
