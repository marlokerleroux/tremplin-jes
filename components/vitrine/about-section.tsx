import { Trophy, Camera, Music } from "lucide-react"

export function AboutSection() {
  return (
    <section id="a-propos" className="scroll-mt-20 py-20 md:py-28 bg-primary/5">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6 mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold text-primary">
            6 finalistes, 1 seul laureat !
          </h2>
          <p className="text-lg md:text-xl text-foreground/70 leading-relaxed">
            Le Tremplin Jeunes en Scene est un tremplin musical breton destine aux jeunes artistes
            de 13 a 23 ans. Apres les auditions de janvier, 6 finalistes ont ete selectionnes pour
            s&apos;affronter sur la scene du Vauban a Brest le 13 mai 2026.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center space-y-4">
            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto">
              <Music className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Le Tremplin</h3>
            <p className="text-foreground/60 leading-relaxed">
              Un concert-concours ouvert a tous les styles musicaux. Les 6 finalistes se produisent
              devant un jury de professionnels et le public.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm text-center space-y-4">
            <div className="w-14 h-14 bg-secondary/20 rounded-xl flex items-center justify-center mx-auto">
              <Trophy className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Prix du Jury</h3>
            <p className="text-foreground/60 leading-relaxed">
              Le laureat remporte une tournee dans les festivals bretons partenaires de
              l&apos;association Pass&apos;Musique.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm text-center space-y-4">
            <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center mx-auto">
              <Camera className="h-7 w-7 text-accent" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Prix du Public</h3>
            <p className="text-foreground/60 leading-relaxed">
              Le public vote pour son artiste prefere ! Le gagnant remporte une seance photo
              professionnelle.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
