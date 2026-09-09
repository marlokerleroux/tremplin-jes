import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/auth-helpers"
import { TechnicalSheetUpload } from "@/components/technical-sheet-upload"
import { getCurrentApplication, getSeasonConfig } from "@/lib/season-config"
import { technicalSheetUrl } from "@/lib/documents"

export default async function TechnicalSheetPage() {
  const session = await requireAuth()
  const config = await getSeasonConfig()

  const application = await getCurrentApplication(session.user.id, config.edition, { technical_sheet: true })
  if (!application) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-[#246BDC] mb-3">Fiche technique</h1>
          <p className="text-gray-700 text-lg leading-relaxed">Envoyez votre fiche technique au format PDF</p>
        </div>
        <TechnicalSheetUpload
          applicationId={application.id}
          existingUrl={application.technical_sheet?.pdf_url ? technicalSheetUrl(application.id) : null}
          applicationStatus={application.status}
        />
      </div>
    </div>
  )
}
