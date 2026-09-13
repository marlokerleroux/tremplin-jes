import type React from "react"

/** Mise en page des documents imprimables (fond blanc, marges d'impression, sauts de page). */
export default function PrintLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-white text-black print:min-h-0">
      <style>{`
        @page { size: A4; margin: 14mm; }
        @media print {
          html, body { background: white !important; }
          .print-page { break-after: page; page-break-after: always; }
          .print-page:last-child { break-after: auto; page-break-after: auto; }
          .print-avoid-break { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>
      {children}
    </div>
  )
}
