import { FinalistCard } from "@/components/vitrine/finalist-card"
import { TornEdge } from "@/components/vitrine/torn-edge"
import type { VitrineEditionDTO } from "@/lib/vitrine/site"

export function FinalistsSection({ edition, retrospective = false }: { edition: VitrineEditionDTO; retrospective?: boolean }) {
  const place = [edition.final_venue, edition.final_city].filter(Boolean).join(", ")
  return (
    <section id="finalistes" className="relative scroll-mt-20 py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold text-primary uppercase">{retrospective ? `Les finalistes ${edition.edition}` : "Les Finalistes"}</h2>
          <p className="text-lg text-foreground/60 max-w-2xl mx-auto">
            {edition.finalists.length === 0
              ? "Les finalistes seront annoncés à l'issue des auditions."
              : retrospective
                ? `Les ${edition.finalists.length} artistes qui se sont produits${place ? ` sur la scène de ${place}` : ""}`
                : `Découvrez les ${edition.finalists.length} artistes qui se produiront${place ? ` sur la scène de ${place}` : ""}`}
          </p>
        </div>

        {edition.finalists.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
            {edition.finalists.map((finalist) => (
              <FinalistCard key={finalist.id} finalist={finalist} badge={finalist.name === edition.jury_winner ? "Prix du jury" : finalist.name === edition.public_winner ? "Prix du public" : undefined} />
            ))}
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0">
        <TornEdge bgColor="text-[oklch(0.97_0.01_264)]" />
      </div>
    </section>
  )
}
