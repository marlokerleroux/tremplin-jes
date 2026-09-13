import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

/**
 * Espace candidat et administration : toute chaîne trop longue pour son conteneur (nom de fichier,
 * email, nom de scène, biographie sans espace…) peut être coupée, afin qu'aucune page ne déborde
 * horizontalement sur mobile.
 */
export default function CandidatLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <div className="min-w-0 [overflow-wrap:anywhere]">{children}</div>
}
