import { finalists } from "@/lib/vitrine/data"
import { FinalistCard } from "@/components/vitrine/finalist-card"

export function FinalistsSection() {
  return (
    <section id="finalistes" className="scroll-mt-20 py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold text-primary">Les Finalistes</h2>
          <p className="text-lg text-foreground/60 max-w-2xl mx-auto">
            Decouvrez les 6 artistes qui se produiront sur la scene du Vauban
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
          {finalists.map((finalist) => (
            <FinalistCard key={finalist.id} finalist={finalist} />
          ))}
        </div>
      </div>
    </section>
  )
}
