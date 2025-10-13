import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ParentalAuthorizationUpload } from "@/components/parental-authorization-upload"

export default async function ParentalAuthorizationPage({
  searchParams,
}: {
  searchParams: { memberIndex?: string; memberName?: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const memberIndex = searchParams.memberIndex ? Number.parseInt(searchParams.memberIndex) : 0
  const memberName = searchParams.memberName || "Candidat"

  // Récupérer l'application de l'utilisateur
  const { data: application } = await supabase.from("applications").select("*").eq("user_id", user.id).single()

  if (!application) {
    redirect("/apply")
  }

  const { data: authorization } = await supabase
    .from("parental_authorizations")
    .select("*")
    .eq("application_id", application.id)
    .eq("member_index", memberIndex)
    .maybeSingle()

  // Vérifier si la candidature est validée (verrouillée)
  const isLocked = application.status === "validated"

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-[#246BDC] mb-3">Autorisation parentale</h1>
          <p className="text-gray-700 text-lg leading-relaxed">
            {memberName !== "Candidat" ? `Pour ${memberName}` : ""}
          </p>
          <p className="text-gray-600 mt-2">Téléchargez, remplissez et uploadez l'autorisation parentale signée</p>
        </div>
        <ParentalAuthorizationUpload
          applicationId={application.id}
          memberIndex={memberIndex}
          memberName={memberName}
          existingAuthorization={authorization}
          isLocked={isLocked}
        />
      </div>
    </div>
  )
}
