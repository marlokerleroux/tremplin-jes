import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { TechnicalSheetUpload } from "@/components/technical-sheet-upload"

export default async function TechnicalSheetPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user application
  const { data: application } = await supabase.from("applications").select("*").eq("user_id", user.id).maybeSingle()

  if (!application) {
    redirect("/dashboard")
  }

  // Get existing technical sheet if any
  const { data: existingSheet } = await supabase
    .from("technical_sheets")
    .select("*")
    .eq("application_id", application.id)
    .maybeSingle()

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
