"use client"

import { Printer } from "lucide-react"
import { Button } from "@/components/ui/button"

/** Barre d'actions masquée à l'impression. */
export function PrintToolbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="print:hidden flex flex-wrap items-center justify-between gap-3 border-b bg-muted/40 px-6 py-3 mb-6">
      <div>
        <p className="font-semibold">{title}</p>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => window.close()}>
          Fermer
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" />
          Imprimer
        </Button>
      </div>
    </div>
  )
}
