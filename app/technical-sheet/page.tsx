import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { TechnicalSheetUpload } from "@/components/technical-sheet-upload"

export default async function TechnicalSheetPage() {
  const session = await requireAuth()

  // Get user application
  const application = await prisma.application.findUnique({
    where: { user_id: session.user.id },
  })

  if (!application) {
    redirect("/dashboard")
  }

  // Get existing technical sheet if any
  const existingSheet = await prisma.technicalSheet.findFirst({
    where: { application_id: application.id },
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-[#246BDC] mb-3">Fiche technique</h1>
          <p className="text-gray-700 text-lg leading-relaxed">Téléchargez votre fiche technique au format PDF</p>
        </div>
        <TechnicalSheetUpload
          applicationId={application.id}
          existingSheet={existingSheet}
          applicationStatus={application.status}
        />
      </div>
    </div>
  )
}
