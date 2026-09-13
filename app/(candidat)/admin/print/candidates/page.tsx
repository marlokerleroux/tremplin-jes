import type { Metadata } from "next"
import { requireAdmin } from "@/lib/auth-helpers"
import { getSeasonState } from "@/lib/season-config"
import { listApplicationsForPrint } from "@/lib/print-data"
import { computeAgeAt, formatDateFr, formatDateShortFr, isIsoDate, isMinorAt } from "@/lib/season"
import { PrintToolbar } from "@/components/admin/print/print-toolbar"
import type { AdminApplicationDTO } from "@/lib/admin-data"

export const metadata: Metadata = { title: "Fiches jury - Tremplin Jeunes en Scène", robots: { index: false, follow: false } }

const JURY_CRITERIA = ["Qualité musicale / interprétation", "Présence scénique", "Originalité / univers", "Impression d'ensemble"]

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <p className="text-sm">
      <span className="text-gray-500">{label} : </span>
      <span className="font-medium">{value || "—"}</span>
    </p>
  )
}

function CandidateSheet({ application, ageReferenceDate, venue }: { application: AdminApplicationDTO; ageReferenceDate: string; venue: string }) {
  const refLabel = formatDateShortFr(ageReferenceDate)
  const members = application.group_members
  const hasMinor = members.some((m) => m.birthDate && isMinorAt(m.birthDate, ageReferenceDate))
  return (
    <article className="print-page mx-auto max-w-3xl px-6 pb-10">
      <header className="flex items-start justify-between border-b-2 border-black pb-3 mb-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Tremplin Jeunes en Scène · édition {application.edition} · fiche jury</p>
          <h1 className="text-3xl font-bold">{application.stage_name}</h1>
          <p className="text-sm text-gray-700">
            {application.application_type === "solo" ? "Artiste solo" : `Groupe · ${members.length} membres`} · {application.musical_style}
          </p>
        </div>
        <div className="text-right text-sm">
          {application.time_slot ? (
            <>
              <p className="font-semibold">{formatDateFr(application.time_slot.date)}</p>
              <p className="text-2xl font-bold">{application.time_slot.start_time}</p>
              <p className="text-gray-600">{venue}</p>
            </>
          ) : (
            <p className="text-gray-500">Créneau non attribué</p>
          )}
        </div>
      </header>

      <section className="grid grid-cols-2 gap-x-6 gap-y-1 mb-4">
        <Field label="Contact" value={`${application.profile?.first_name ?? ""} ${application.profile?.last_name ?? ""}`.trim()} />
        <Field label="Téléphone" value={application.profile?.phone} />
        <Field label="Email" value={application.profile?.email} />
        <Field label="Ville" value={`${application.profile?.postal_code ?? ""} ${application.profile?.city ?? ""}`.trim()} />
        <Field label="Instagram" value={application.instagram ? `@${application.instagram.replace("@", "")}` : null} />
        <Field label="Composition originale" value={application.has_original_composition ? `Oui${application.is_sacem_registered ? " (SACEM)" : ""}` : "Non"} />
        <Field label="Diffusion autorisée" value={application.allows_broadcast ? "Oui" : "Non"} />
        <Field label="Fiche technique" value={application.technical_sheet?.pdf_url ? "Fournie" : "Manquante"} />
        {hasMinor && <Field label="Mineur(s)" value="Oui : autorisation(s) parentale(s) au dossier" />}
      </section>

      <section className="mb-4 print-avoid-break">
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-600 mb-1">
          {application.application_type === "solo" ? "Artiste" : "Membres"} (âges au {refLabel})
        </h2>
        <ul className="grid grid-cols-2 gap-x-6 text-sm">
          {members.map((member, index) => (
            <li key={index}>
              {application.application_type === "solo" ? application.stage_name : `${member.firstName} ${member.lastName}`.trim() || `Membre ${index + 1}`}
              {member.birthDate && ` · ${computeAgeAt(member.birthDate, ageReferenceDate) ?? "?"} ans`}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-600 mb-1">Biographie</h2>
        <p className="text-sm leading-snug whitespace-pre-wrap break-words">{application.biography}</p>
      </section>

      {application.has_stage_experience && application.stage_experience_details && (
        <section className="mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-600 mb-1">Expérience scénique</h2>
          <p className="text-sm leading-snug whitespace-pre-wrap break-words">{application.stage_experience_details}</p>
        </section>
      )}

      <section className="print-avoid-break border-2 border-black rounded p-3 mt-6">
        <h2 className="text-sm font-bold uppercase tracking-wide mb-2">Évaluation du jury (usage interne)</h2>
        <table className="w-full text-sm border-collapse mb-3">
          <thead>
            <tr className="border-b border-black">
              <th className="text-left py-1 font-semibold">Critère</th>
              <th className="text-left py-1 font-semibold w-24">Note</th>
              <th className="text-left py-1 font-semibold">Remarques</th>
            </tr>
          </thead>
          <tbody>
            {JURY_CRITERIA.map((criterion) => (
              <tr key={criterion} className="border-b border-gray-300 h-9">
                <td className="py-1 pr-2">{criterion}</td>
                <td className="py-1">/ 20</td>
                <td />
              </tr>
            ))}
            <tr className="h-9">
              <td className="py-1 font-semibold">Total</td>
              <td className="py-1 font-semibold">/ 80</td>
              <td />
            </tr>
          </tbody>
        </table>
        <p className="text-sm font-semibold mb-1">Commentaires</p>
        <div className="h-24 border-b border-dotted border-gray-400" />
        <div className="h-8 border-b border-dotted border-gray-400" />
        <p className="text-sm mt-3">
          Membre du jury : ______________________ &nbsp;&nbsp; Finaliste proposé : ☐ oui &nbsp; ☐ non
        </p>
      </section>
    </article>
  )
}

export default async function CandidateSheetsPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; date?: string; status?: string }>
}) {
  await requireAdmin()
  const params = await searchParams
  const season = await getSeasonState()
  const filter = {
    edition: season.config.edition,
    id: params.id && /^[0-9a-f-]{36}$/i.test(params.id) ? params.id : undefined,
    date: params.date && isIsoDate(params.date) ? params.date : undefined,
    status: params.status === "validated" ? ("validated" as const) : undefined,
  }
  const applications = await listApplicationsForPrint(filter)
  const subtitle = filter.id
    ? "Fiche individuelle"
    : filter.date
      ? `Candidats du ${formatDateFr(filter.date)}`
      : filter.status
        ? "Candidatures validées"
        : "Toutes les candidatures non refusées"

  return (
    <>
      <PrintToolbar title={`Fiches jury · édition ${season.config.edition}`} subtitle={`${subtitle} · ${applications.length} fiche(s)`} />
      {applications.length === 0 ? (
        <p className="px-6 text-sm text-gray-600">Aucune candidature à imprimer pour ce filtre.</p>
      ) : (
        applications.map((application) => (
          <CandidateSheet key={application.id} application={application} ageReferenceDate={season.ageReferenceDate} venue={season.venue} />
        ))
      )}
    </>
  )
}
