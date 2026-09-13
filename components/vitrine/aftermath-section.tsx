import { Camera, CalendarDays, ExternalLink, MapPin, PlayCircle, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TornEdge } from "@/components/vitrine/torn-edge"
import type { VitrineEditionDTO } from "@/lib/vitrine/site"
import { formatDateFr } from "@/lib/season"
import { extractYoutubeId } from "@/lib/vitrine/modes"

/** Après la finale : lauréats, remerciements, vidéo, photos et tournée des festivals. */
export function AftermathSection({ edition }: { edition: VitrineEditionDTO }) {
  const videoId = edition.aftermath_video_url ? extractYoutubeId(edition.aftermath_video_url) : ""
  return (
    <>
      <section id="apres-la-finale" className="relative scroll-mt-20 py-20 md:py-28 bg-primary/5">
        <div className="container mx-auto px-4 space-y-12">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-extrabold text-primary uppercase">Les lauréats {edition.edition}</h2>
            {edition.aftermath_text && <p className="text-lg text-foreground/70 leading-relaxed whitespace-pre-line">{edition.aftermath_text}</p>}
          </div>

          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="bg-primary text-white p-8 text-center space-y-3 -rotate-1 shadow-xl">
              <Trophy className="h-10 w-10 mx-auto text-secondary" />
              <p className="text-sm font-extrabold uppercase tracking-widest text-white/80">Prix du jury</p>
              <p className="text-3xl font-extrabold">{edition.jury_winner || "À venir"}</p>
              {edition.jury_prize_text && <p className="text-white/80 text-sm leading-relaxed">{edition.jury_prize_text}</p>}
            </div>
            <div className="bg-accent text-white p-8 text-center space-y-3 rotate-1 shadow-xl">
              <Camera className="h-10 w-10 mx-auto text-secondary" />
              <p className="text-sm font-extrabold uppercase tracking-widest text-white/80">Prix du public</p>
              <p className="text-3xl font-extrabold">{edition.public_winner || "À venir"}</p>
              {edition.public_prize_text && <p className="text-white/80 text-sm leading-relaxed">{edition.public_prize_text}</p>}
            </div>
          </div>

          {(videoId || edition.aftermath_video_url || edition.aftermath_photos_url) && (
            <div className="max-w-3xl mx-auto space-y-6">
              {videoId && (
                <div className="aspect-video overflow-hidden shadow-xl border-2 border-foreground/10">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title={`Retour sur la finale ${edition.edition}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    className="w-full h-full"
                  />
                </div>
              )}
              <div className="flex flex-wrap justify-center gap-4">
                {edition.aftermath_video_url && !videoId && (
                  <Button asChild variant="outline" className="rounded-none font-bold uppercase tracking-wider">
                    <a href={edition.aftermath_video_url} target="_blank" rel="noopener noreferrer">
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Revoir la finale
                    </a>
                  </Button>
                )}
                {edition.aftermath_photos_url && (
                  <Button asChild variant="outline" className="rounded-none font-bold uppercase tracking-wider">
                    <a href={edition.aftermath_photos_url} target="_blank" rel="noopener noreferrer">
                      <Camera className="h-4 w-4 mr-2" />
                      Les photos
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <TornEdge bgColor="text-white" />
        </div>
      </section>

      {edition.tour_dates.length > 0 && (
        <section id="tournee" className="relative scroll-mt-20 py-20 md:py-28">
          <div className="container mx-auto px-4">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl md:text-5xl font-extrabold text-primary uppercase">La tournée de l&apos;été</h2>
              <p className="text-lg text-foreground/60 max-w-2xl mx-auto">
                {edition.jury_winner ? `Retrouvez ${edition.jury_winner} sur les scènes des festivals partenaires.` : "Retrouvez le lauréat sur les scènes des festivals partenaires."}
              </p>
            </div>
            <ul className="max-w-3xl mx-auto divide-y border-y">
              {edition.tour_dates.map((date) => (
                <li key={`${date.date}-${date.name}`} className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div className="flex items-center gap-3">
                    <CalendarDays className="h-5 w-5 text-accent shrink-0" />
                    <span className="font-bold text-foreground">{formatDateFr(date.date)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-foreground/70">
                    <span className="font-semibold text-foreground">{date.name}</span>
                    {date.city && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {date.city}
                      </span>
                    )}
                    {date.url && (
                      <a href={date.url} target="_blank" rel="noopener noreferrer" className="text-primary inline-flex items-center gap-1 underline underline-offset-4">
                        Infos
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="absolute bottom-0 left-0 right-0">
            <TornEdge bgColor="text-[oklch(0.97_0.01_264)]" />
          </div>
        </section>
      )}
    </>
  )
}
