import { requireAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { listApplicationsForAdmin, listTimeSlots } from "@/lib/admin-data"
import { getSeasonConfig, serializeSeasonConfig } from "@/lib/season-config"

export default async function AdminPage() {
  await requireAdmin()

  const config = await getSeasonConfig()
  const [applications, timeSlots, smtpConfigured] = await Promise.all([
    listApplicationsForAdmin(config.edition),
    listTimeSlots(config.edition),
    prisma.smtpConfig.count().then((count) => count > 0),
  ])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50">
      <AdminDashboard
        initialApplications={applications}
        initialTimeSlots={timeSlots}
        initialSeason={serializeSeasonConfig(config)}
        smtpConfigured={smtpConfigured}
      />
    </div>
  )
}
