import { requireAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { AdminDashboard } from "@/components/admin-dashboard"

export default async function AdminPage() {
  await requireAdmin()

  const applications = await prisma.application.findMany({
    include: {
      profile: {
        select: {
          first_name: true,
          last_name: true,
          email: true,
          street_address: true,
          city: true,
          postal_code: true,
          phone: true,
          role: true,
        },
      },
      technical_sheets: true,
      parental_authorizations: true,
    },
    orderBy: { created_at: "desc" },
  })

  const nonAdminApplications = applications
    .filter((app) => app.profile?.role !== "admin")
    .map((app) => ({
      ...app,
      profiles: app.profile,
    }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50">
      <AdminDashboard applications={nonAdminApplications || []} />
    </div>
  )
}
