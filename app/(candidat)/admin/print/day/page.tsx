import type { Metadata } from "next"
import { requireAdmin } from "@/lib/auth-helpers"
import { getSeasonState } from "@/lib/season-config"
import { listApplicationsForPrint, memberCount } from "@/lib/print-data"
import { formatDateFr, isIsoDate } from "@/lib/season"
import { PrintToolbar } from "@/components/admin/print/print-toolbar"

export const metadata: Metadata = { title: "Ordre de passage - Tremplin Jeunes en Scène", robots: { index: false, follow: false } }

export default async function RunningOrderPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  await requireAdmin()
  const params = await searchParams
  const season = await getSeasonState()
  const date = params.date && isIsoDate(params.date) ? params.date : null
  const dates = date ? [date] : [...season.config.audition_dates].sort()

  const byDate = await Promise.all(
    dates.map(async (d) => ({ date: d, applications: await listApplicationsForPrint({ edition: season.config.edition, date: d }) })),
  )

  return (
    <>
      <PrintToolbar title={`Ordre de passage · édition ${season.config.edition}`} subtitle={date ? formatDateFr(date) : `${dates.length} journée(s) d'audition`} />
      {byDate.length === 0 && <p className="px-6 text-sm text-gray-600">Aucune date d&#39;audition configurée.</p>}
      {byDate.map(({ date: d, applications }) => (
        <section key={d} className="print-page mx-auto max-w-4xl px-6 pb-10">
          <header className="border-b-2 border-black pb-2 mb-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Tremplin Jeunes en Scène · édition {season.config.edition}</p>
            <h1 className="text-2xl font-bold">Ordre de passage · {formatDateFr(d)}</h1>
            <p className="text-sm text-gray-700">
              {season.venue} · {applications.length} candidat(s){!season.config.is_validated && " · planning en brouillon"}
            </p>
          </header>
          {applications.length === 0 ? (
            <p className="text-sm text-gray-600">Aucun créneau attribué pour cette journée.</p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-black text-left">
                  <th className="py-1 pr-2 w-16">Heure</th>
                  <th className="py-1 pr-2">Nom de scène</th>
                  <th className="py-1 pr-2">Contact</th>
                  <th className="py-1 pr-2 w-16">Pers.</th>
                  <th className="py-1 pr-2">Style</th>
                  <th className="py-1 pr-2 w-14 text-center">Fiche tech.</th>
                  <th className="py-1 pr-2 w-16 text-center">Arrivé</th>
                  <th className="py-1 w-16 text-center">Passé</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id} className="border-b border-gray-300 align-top">
                    <td className="py-2 pr-2 font-bold">{app.time_slot?.start_time}</td>
                    <td className="py-2 pr-2">
                      <span className="font-semibold">{app.stage_name}</span>
                      <span className="block text-xs text-gray-600">{app.application_type === "solo" ? "Solo" : "Groupe"}</span>
                    </td>
                    <td className="py-2 pr-2">
                      {app.profile?.first_name} {app.profile?.last_name}
                      <span className="block text-xs text-gray-600">{app.profile?.phone}</span>
                    </td>
                    <td className="py-2 pr-2">{memberCount(app)}</td>
                    <td className="py-2 pr-2">{app.musical_style}</td>
                    <td className="py-2 pr-2 text-center">{app.technical_sheet?.pdf_url ? "✓" : "—"}</td>
                    <td className="py-2 pr-2 text-center text-lg">☐</td>
                    <td className="py-2 text-center text-lg">☐</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ))}
    </>
  )
}
