import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/auth-helpers"
import { ParentalAuthorizationUpload } from "@/components/parental-authorization-upload"
import { getCurrentApplication, getSeasonConfig } from "@/lib/season-config"
import { normalizeGroupMembers } from "@/lib/admin-data"
import { parentalAuthorizationUrl } from "@/lib/documents"

export default async function ParentalAuthorizationPage({
  searchParams,
}: {
  searchParams: Promise<{ memberIndex?: string }>
}) {
  const session = await requireAuth()
  const params = await searchParams
  const parsedIndex = Number.parseInt(params.memberIndex ?? "0", 10)
  const memberIndex = Number.isInteger(parsedIndex) && parsedIndex >= 0 ? parsedIndex : 0

  const config = await getSeasonConfig()
  const application = await getCurrentApplication(session.user.id, config.edition, {
    parental_authorizations: { where: { member_index: memberIndex } },
  })
  if (!application) {
    redirect("/apply")
  }

  const members = normalizeGroupMembers(application.group_members)
  const member = members[memberIndex]
  if (!member) {
    redirect("/dashboard")
  }
  const memberName =
    application.application_type === "solo" ? "Candidat" : `${member.firstName} ${member.lastName}`.trim() || "Candidat"
  const authorization = application.parental_authorizations[0] ?? null
  const isLocked = application.status === "validated"

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-[#246BDC] mb-3">Autorisation parentale</h1>
          <p className="text-gray-700 text-lg leading-relaxed">{memberName !== "Candidat" ? `Pour ${memberName}` : ""}</p>
          <p className="text-gray-600 mt-2">Téléchargez le modèle, faites-le signer puis envoyez-le ici</p>
        </div>
        <ParentalAuthorizationUpload
          applicationId={application.id}
          memberIndex={memberIndex}
          existingUrl={authorization ? parentalAuthorizationUrl(application.id, memberIndex) : null}
          isLocked={isLocked}
        />
      </div>
    </div>
  )
}
