import { Trophy, Camera, Music } from "lucide-react"
import { TornEdge } from "@/components/vitrine/torn-edge"

export function AboutSection() {
  return (
    <section id="a-propos" className="relative scroll-mt-20 py-20 md:py-28 bg-primary/5">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6 mb-16">
          <p className="inline-block bg-accent/10 text-accent font-extrabold text-sm uppercase tracking-widest px-4 py-1.5 -rotate-2">
            10 ans du Tremplin
          </p>
          <h2 className="text-3xl md:text-5xl font-extrabold text-primary uppercase">
            6 finalistes,<br />1 seul lauréat !
          </h2>
          <p className="text-lg md:text-xl text-foreground/70 leading-relaxed">
            Depuis 10 ans, le Tremplin Jeunes en Scène révèle les talents musicaux bretons.
            Pour cette édition anniversaire, 6 finalistes de 13 à 23 ans s&apos;affronteront sur
            la scène du Vauban à Brest le 13 mai 2026.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white rounded-none p-8 shadow-md text-center space-y-4 border-2 border-foreground/10">
            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto">
              <Music className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Le Tremplin</h3>
            <p className="text-foreground/60 leading-relaxed">
              Un concert ouvert à tous les styles musicaux. Les 6 finalistes se produisent
              devant un jury de professionnels et le public.
            </p>
          </div>

          <div className="bg-white rounded-none p-8 shadow-md text-center space-y-4 border-2 border-foreground/10">
            <div className="w-14 h-14 bg-secondary/20 rounded-xl flex items-center justify-center mx-auto">
              <Trophy className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Prix du Jury</h3>
            <p className="text-foreground/60 leading-relaxed">
              Le lauréat remporte une tournée dans les festivals bretons partenaires de
              l&apos;association Pass&apos;Musique, ainsi que l&apos;enregistrement d&apos;un EP dans un studio partenaire.
            </p>
          </div>

          <div className="bg-white rounded-none p-8 shadow-md text-center space-y-4 border-2 border-foreground/10">
            <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center mx-auto">
              <Camera className="h-7 w-7 text-accent" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Prix du Public</h3>
            <p className="text-foreground/60 leading-relaxed">
              Le public vote pour son artiste préféré ! Le gagnant remporte une séance photo
              professionnelle et l&apos;enregistrement d&apos;une maquette.
            </p>
          </div>
        </div>
      </div>

      {/* Torn edge into finalists section */}
      <div className="absolute bottom-0 left-0 right-0">
        <TornEdge bgColor="text-white" />
      </div>
    </section>
  )
}
