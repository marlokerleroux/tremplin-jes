import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import type { Finalist } from "@/lib/vitrine/data"

export function FinalistCard({ finalist }: { finalist: Finalist }) {
  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
      <div className="aspect-square relative overflow-hidden bg-primary/5">
        <Image
          src={finalist.image}
          alt={finalist.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-5 space-y-2">
        <h3 className="text-xl font-bold text-foreground">{finalist.name}</h3>
        <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
          {finalist.genre}
        </Badge>
        {finalist.description && (
          <p className="text-sm text-foreground/60 pt-1">{finalist.description}</p>
        )}
      </div>
    </div>
  )
}
