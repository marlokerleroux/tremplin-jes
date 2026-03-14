import Image from "next/image"
import { partners } from "@/lib/vitrine/data"

export function PartnersSection() {
  if (partners.length === 0) {
    return (
      <section id="partenaires" className="scroll-mt-20 py-20 md:py-28 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold text-primary mb-6">Nos Partenaires</h2>
          <p className="text-lg text-foreground/60">Partenaires a venir...</p>
        </div>
      </section>
    )
  }

  return (
    <section id="partenaires" className="scroll-mt-20 py-20 md:py-28 bg-primary/5">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-5xl font-extrabold text-primary text-center mb-16">
          Nos Partenaires
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center max-w-5xl mx-auto">
          {partners.map((partner) => {
            const img = (
              <Image
                src={partner.logo}
                alt={partner.name}
                width={160}
                height={80}
                className="h-16 w-auto mx-auto grayscale hover:grayscale-0 transition-all opacity-70 hover:opacity-100"
              />
            )
            return partner.url ? (
              <a key={partner.name} href={partner.url} target="_blank" rel="noopener noreferrer">
                {img}
              </a>
            ) : (
              <div key={partner.name}>{img}</div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
