import type { Metadata } from "next"
import Image from "next/image"
import { Music, Users, Mic, Trophy, Calendar, Star, Heart } from "lucide-react"
import { TornEdge } from "@/components/vitrine/torn-edge"

export const metadata: Metadata = {
  title: "À propos - Tremplin Jeunes en Scène",
  description:
    "Découvrez l'association Pass'Musique et le Tremplin Jeunes en Scène, le tremplin musical breton pour les jeunes artistes de 13 à 23 ans depuis 2013.",
  openGraph: {
    title: "À propos - Tremplin Jeunes en Scène",
    description:
      "Découvrez l'association Pass'Musique et le Tremplin Jeunes en Scène, le tremplin musical breton pour les jeunes artistes de 13 à 23 ans.",
    type: "website",
    images: [{ url: "/images/hero-tremplin.jpg", width: 1920, height: 1278 }],
  },
}

export default function AProposPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative bg-primary text-white py-20 md:py-28 overflow-hidden">
        <div className="container mx-auto px-4 text-center space-y-6 relative z-10">
          <p className="inline-block bg-white/10 text-white font-extrabold text-sm uppercase tracking-widest px-4 py-1.5">
            Depuis 2013
          </p>
          <h1 className="text-4xl md:text-6xl font-extrabold uppercase tracking-tight">
            À propos
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
            Le talent n&apos;attend pas le nombre d&apos;années
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <TornEdge bgColor="text-white" />
        </div>
      </section>

      {/* Qu'est-ce que le Tremplin */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-3xl md:text-5xl font-extrabold text-primary uppercase text-center">
              Qu&apos;est-ce que le Tremplin&nbsp;?
            </h2>
            <p className="text-lg text-foreground/70 leading-relaxed text-center max-w-3xl mx-auto">
              Jeunes en Scène est un tremplin musical pour les jeunes artistes de 13 à 23 ans.
              Gratuit et ouvert à tous les genres musicaux, il offre la possibilité à tous ses
              candidats de se présenter devant un jury de professionnels du secteur.
            </p>
            <p className="text-lg text-foreground/70 leading-relaxed text-center max-w-3xl mx-auto">
              <strong className="text-primary">À la clef ?</strong> Une finale endiablée au Vauban
              suivie d&apos;une tournée d&apos;ouvertures de festivals finistériens pour le vainqueur.
            </p>

            {/* 5 étapes */}
            <div className="grid md:grid-cols-2 gap-6 pt-8">
              <div className="bg-primary/5 p-6 space-y-3 border-l-4 border-primary">
                <div className="flex items-center gap-3">
                  <Calendar className="h-6 w-6 text-primary shrink-0" />
                  <h3 className="text-lg font-bold text-foreground">Les inscriptions</h3>
                </div>
                <p className="text-foreground/60 leading-relaxed">
                  Du 15 octobre au 31 décembre, nos bénévoles passionnés parcourent les routes et
                  les réseaux pour communiquer l&apos;événement à nos jeunes prodiges.
                </p>
              </div>

              <div className="bg-primary/5 p-6 space-y-3 border-l-4 border-primary">
                <div className="flex items-center gap-3">
                  <Mic className="h-6 w-6 text-primary shrink-0" />
                  <h3 className="text-lg font-bold text-foreground">Les auditions</h3>
                </div>
                <p className="text-foreground/60 leading-relaxed">
                  L&apos;ensemble des candidats se présentent en live à l&apos;Espace Léo Ferré, à Brest.
                  À l&apos;issue de deux folles journées, 6 groupes et/ou artistes sont sélectionnés
                  pour participer à la finale.
                </p>
              </div>

              <div className="bg-primary/5 p-6 space-y-3 border-l-4 border-accent">
                <div className="flex items-center gap-3">
                  <Star className="h-6 w-6 text-accent shrink-0" />
                  <h3 className="text-lg font-bold text-foreground">La pré-production</h3>
                </div>
                <p className="text-foreground/60 leading-relaxed">
                  Un accompagnement artistique est offert à nos 6 finalistes pour se préparer au
                  mieux à la grande finale du Vauban. Technique vocale, présence scénique,
                  direction artistique : un programme rythmé et animé !
                </p>
              </div>

              <div className="bg-primary/5 p-6 space-y-3 border-l-4 border-accent">
                <div className="flex items-center gap-3">
                  <Trophy className="h-6 w-6 text-accent shrink-0" />
                  <h3 className="text-lg font-bold text-foreground">La finale</h3>
                </div>
                <p className="text-foreground/60 leading-relaxed">
                  Nos 6 finalistes s&apos;affrontent sur la mythique salle du Cabaret Vauban à Brest.
                  Notre jury aura la lourde tâche de décerner notre grand vainqueur.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pourquoi unique */}
      <section className="relative py-20 md:py-28 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-12">
            <h2 className="text-3xl md:text-5xl font-extrabold text-primary uppercase text-center">
              Pourquoi ce tremplin est unique&nbsp;?
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-8 shadow-md space-y-4 border-2 border-foreground/10">
                <div className="w-14 h-14 bg-secondary/20 rounded-xl flex items-center justify-center">
                  <Heart className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Pour les très jeunes talents</h3>
                <p className="text-foreground/60 leading-relaxed">
                  Il était une fois l&apos;histoire d&apos;une musicienne de 15 ans qui se fit refuser
                  l&apos;inscription à cause de son jeune âge. Les tremplins musicaux, ce n&apos;est jamais
                  avant 16 ans ! C&apos;est en ricochet à cette histoire que l&apos;idée du Tremplin Jeunes
                  en Scène est née. Un tremplin musical pour les TRÈS jeunes talents, le seul de
                  sa région.
                </p>
              </div>

              <div className="bg-white p-8 shadow-md space-y-4 border-2 border-foreground/10">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Music className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Ouvert à tous les genres</h3>
                <p className="text-foreground/60 leading-relaxed">
                  Du rock à la pop, de l&apos;électro à la musique classique, en passant par le rap et
                  la folk, tous les genres sont les bienvenus au Tremplin Jeunes en Scène !
                </p>
              </div>

              <div className="bg-white p-8 shadow-md space-y-4 border-2 border-foreground/10">
                <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center">
                  <Mic className="h-7 w-7 text-accent" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Des auditions 100% live</h3>
                <p className="text-foreground/60 leading-relaxed">
                  Parce que ce serait injuste de sélectionner sur vidéo, et parce que la scène est
                  notre moteur, les auditions sont 100% live ! En moyenne 80 formations, 150
                  musiciens, 16h de musique, le tout sur 2 jours !
                </p>
              </div>

              <div className="bg-white p-8 shadow-md space-y-4 border-2 border-foreground/10">
                <div className="w-14 h-14 bg-secondary/20 rounded-xl flex items-center justify-center">
                  <Star className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Accompagnement professionnel</h3>
                <p className="text-foreground/60 leading-relaxed">
                  Du matériel de qualité pour jouer sur scène comme un pro, un jury de
                  professionnels pour une écoute attentive, un accompagnement de qualité pour
                  s&apos;améliorer, et des festivals partenaires renommés pour permettre aux jeunes
                  prodiges de se faire connaître du public.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <TornEdge bgColor="text-white" />
        </div>
      </section>

      {/* Qui sommes-nous */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-3xl md:text-5xl font-extrabold text-primary uppercase text-center">
              Qui sommes-nous&nbsp;?
            </h2>

            <div className="space-y-6 text-lg text-foreground/70 leading-relaxed max-w-3xl mx-auto">
              <div className="flex items-center justify-center gap-4 pb-4">
                <Image
                  src="/images/passmusique.jpg"
                  alt="Association Pass'Musique"
                  width={180}
                  height={54}
                  className="h-16 w-auto rounded"
                />
              </div>
              <p>
                Le Tremplin Jeunes en Scène est organisé par l&apos;association <strong className="text-foreground">Pass&apos;Musique</strong>.
              </p>
              <p>
                <strong className="text-foreground">Née en 2010</strong>, elle organise la première
                édition du tremplin en 2013. 7 années lui succèderont avec le même enthousiasme et
                la même passion chez ses participants et bénévoles.
              </p>
              <p>
                Puis 2020 pointe son nez, et le tremplin se voit obligé de se mettre sur pause.
                Une pause qui a assez duré...
              </p>
              <p>
                Le tremplin aurait fêté sa <strong className="text-foreground">10e édition l&apos;année
                dernière</strong>, et pour célébrer cela, l&apos;association Pass&apos;Musique a décidé de le
                relancer ! Il n&apos;aura suffi que d&apos;un petit message à tous nos anciens bénévoles pour
                reconstituer l&apos;équipe de ses débuts.
              </p>
              <p>
                Car Pass&apos;Musique, c&apos;est aussi ça : une équipe de bénévoles soudés, passionnés et
                motivés, qui partagent un projet et des valeurs communes, avec envie et bonne humeur.
              </p>
            </div>

            {/* Chiffres clés */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8">
              <div className="text-center space-y-2">
                <p className="text-4xl md:text-5xl font-extrabold text-primary">10</p>
                <p className="text-sm text-foreground/60 font-medium uppercase tracking-wider">Éditions</p>
              </div>
              <div className="text-center space-y-2">
                <p className="text-4xl md:text-5xl font-extrabold text-accent">80+</p>
                <p className="text-sm text-foreground/60 font-medium uppercase tracking-wider">Formations par édition</p>
              </div>
              <div className="text-center space-y-2">
                <p className="text-4xl md:text-5xl font-extrabold text-primary">150+</p>
                <p className="text-sm text-foreground/60 font-medium uppercase tracking-wider">Musiciens auditionnés</p>
              </div>
              <div className="text-center space-y-2">
                <p className="text-4xl md:text-5xl font-extrabold text-accent">16h</p>
                <p className="text-sm text-foreground/60 font-medium uppercase tracking-wider">De musique live</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Presse */}
      <section className="relative py-20 md:py-28 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-12">
            <h2 className="text-3xl md:text-5xl font-extrabold text-primary uppercase text-center">
              On parle de nous
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white p-6 shadow-md space-y-3 border-2 border-foreground/10">
                <p className="text-sm font-bold text-foreground/40 uppercase tracking-wider">Le Télégramme</p>
                <h3 className="text-lg font-bold text-foreground leading-snug">
                  Tremplin Jeunes en Scène : succès retentissant des auditions, à Brest
                </h3>
                <p className="text-sm text-foreground/60">
                  70 passionnés de musique âgés de 13 à 23 ans ont pu se présenter devant un jury
                  de professionnels, et six ont été sélectionnés pour la finale.
                </p>
                <p className="text-xs text-foreground/40">28 janvier 2024</p>
              </div>

              <div className="bg-white p-6 shadow-md space-y-3 border-2 border-foreground/10">
                <p className="text-sm font-bold text-foreground/40 uppercase tracking-wider">Le Télégramme</p>
                <h3 className="text-lg font-bold text-foreground leading-snug">
                  À Brest, le Tremplin Jeunes en Scène revient au Vauban samedi
                </h3>
                <p className="text-sm text-foreground/60">
                  Les bénévoles de Pass&apos;Musique organisent le Tremplin Jeunes en Scène depuis 2013.
                </p>
                <p className="text-xs text-foreground/40">5 mai 2025</p>
              </div>

              <div className="bg-white p-6 shadow-md space-y-3 border-2 border-foreground/10">
                <p className="text-sm font-bold text-foreground/40 uppercase tracking-wider">Le Télégramme</p>
                <h3 className="text-lg font-bold text-foreground leading-snug">
                  Le Tremplin Jeunes en Scène revient à Brest en 2024 pour caster des musiciens de 13 à 23 ans
                </h3>
                <p className="text-sm text-foreground/60">
                  L&apos;association Pass&apos;Musique organise, pour la première fois depuis quatre ans, un
                  nouveau tremplin Jeunes en Scène, à Brest en 2024.
                </p>
                <p className="text-xs text-foreground/40">23 novembre 2023</p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <TornEdge bgColor="text-[oklch(0.97_0.01_264)]" />
        </div>
      </section>
    </>
  )
}
