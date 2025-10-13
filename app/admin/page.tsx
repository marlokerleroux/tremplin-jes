import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminDashboard } from "@/components/admin-dashboard"

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is admin
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()

  if (profile?.role !== "admin") {
    redirect("/dashboard")
  }

  const { data: applications, error } = await supabase
    .from("applications")
    .select(
      `
      *,
      profiles:user_id (
        first_name,
        last_name,
        email,
        street_address,
        city,
        postal_code,
        phone,
        role
      )
    `,
    )
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching applications:", error)
  }

  const nonAdminApplications = applications?.filter((app) => app.profiles?.role !== "admin")

  const { data: technicalSheets, error: techError } = await supabase.from("technical_sheets").select("*")
  const { data: parentalAuths, error: parentalError } = await supabase.from("parental_authorizations").select("*")

  if (techError) {
    console.error("Error fetching technical sheets:", techError)
  }
  if (parentalError) {
    console.error("Error fetching parental authorizations:", parentalError)
  }

  const applicationsWithDocs = nonAdminApplications?.map((app) => ({
    ...app,
    technical_sheets: technicalSheets?.filter((ts) => ts.application_id === app.id) || [],
    parental_authorizations: parentalAuths?.filter((pa) => pa.application_id === app.id) || [],
  }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50">
      <AdminDashboard applications={applicationsWithDocs || []} />
    </div>
  )
}
