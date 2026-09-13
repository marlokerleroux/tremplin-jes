import { Trophy, Camera } from "lucide-react"
import { TornEdge } from "@/components/vitrine/torn-edge"
import { FinalistCard } from "@/components/vitrine/finalist-card"
import type { VitrineEditionDTO } from "@/lib/vitrine/site"

/** Palmarès des éditions précédentes (modes avant-ouverture et auditions). */
export function PalmaresSection({ editions }: { editions: VitrineEditionDTO[] }) {
  if (editions.length === 0) return null
  const [latest, ...older] = editions
  return (
    <section id="palmares" className="relative scroll-mt-20 py-20 md:py-28">
      <div className="container mx-auto px-4 space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-5xl font-extrabold text-primary uppercase">Palmarès {latest.edition}</h2>
          <p className="text-lg text-foreground/60 max-w-2xl mx-auto">Ils ont marqué la dernière finale du Tremplin Jeunes en Scène.</p>
        </div>

        {(latest.jury_winner || latest.public_winner) && (
          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {latest.jury_winner && (
              <div className="bg-primary text-white p-8 text-center space-y-3 -rotate-1 shadow-xl">
                <Trophy className="h-10 w-10 mx-auto text-secondary" />
                <p className="text-sm font-extrabold uppercase tracking-widest text-white/80">Prix du jury</p>
                <p className="text-3xl font-extrabold">{latest.jury_winner}</p>
              </div>
            )}
            {latest.public_winner && (
              <div className="bg-accent text-white p-8 text-center space-y-3 rotate-1 shadow-xl">
                <Camera className="h-10 w-10 mx-auto text-secondary" />
                <p className="text-sm font-extrabold uppercase tracking-widest text-white/80">Prix du public</p>
                <p className="text-3xl font-extrabold">{latest.public_winner}</p>
              </div>
            )}
          </div>
        )}

        {latest.finalists.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
            {latest.finalists.map((finalist) => (
              <FinalistCard
                key={finalist.id}
                finalist={finalist}
                badge={finalist.name === latest.jury_winner ? "Prix du jury" : finalist.name === latest.public_winner ? "Prix du public" : undefined}
              />
            ))}
          </div>
        )}

        {older.length > 0 && (
          <div className="max-w-3xl mx-auto">
            <h3 className="text-xl font-bold text-foreground text-center mb-4">Les éditions précédentes</h3>
            <ul className="divide-y border-y">
              {older.map((edition) => (
                <li key={edition.edition} className="flex flex-wrap items-center justify-between gap-2 py-3 text-foreground/70">
                  <span className="font-bold text-foreground">Édition {edition.edition}</span>
                  <span>
                    {edition.jury_winner && `Prix du jury : ${edition.jury_winner}`}
                    {edition.jury_winner && edition.public_winner && " · "}
                    {edition.public_winner && `Prix du public : ${edition.public_winner}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="absolute bottom-0 left-0 right-0">
        <TornEdge bgColor="text-[oklch(0.97_0.01_264)]" />
      </div>
    </section>
  )
}
