"use client"

import { useState } from "react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Finalist } from "@/lib/vitrine/data"

export function FinalistCard({ finalist }: { finalist: Finalist }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative bg-white rounded-none overflow-hidden shadow-md hover:shadow-xl transition-all text-left cursor-pointer odd:rotate-1 even:-rotate-1 hover:rotate-0 border-2 border-foreground/10"
      >
        <div className="aspect-square relative overflow-hidden bg-primary/5">
          <Image
            src={finalist.image}
            alt={finalist.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="p-5 space-y-2">
          <h3 className="text-xl font-bold text-foreground">{finalist.name}</h3>
          <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
            {finalist.genre}
          </Badge>
        </div>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{finalist.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {finalist.genre}
            </Badge>

            {finalist.description && (
              <p className="text-foreground/70 leading-relaxed">{finalist.description}</p>
            )}

            {finalist.youtubeId && (
              <div className="aspect-video rounded-lg overflow-hidden">
                <iframe
                  src={`https://www.youtube.com/embed/${finalist.youtubeId}`}
                  title={`Audition de ${finalist.name}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                  className="w-full h-full"
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
