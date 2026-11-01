"use client"

import { useCallback, useState } from "react"
import Image from "next/image"
import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { AdminApplicationDTO, AuditionTrackingDTO, TimeSlotDTO } from "@/lib/admin-data"
import type { SeasonConfigDTO } from "@/lib/season-config"
import { apiJson } from "@/lib/admin-client"
import { getAgeReferenceDate } from "@/lib/season"
import { ApplicationsTab } from "./applications-tab"
import { ScheduleTab } from "./schedule-tab"
import { AuditionsTab } from "./auditions-tab"
import { SeasonSettings } from "./season-settings"
import { SmtpSettings } from "./smtp-settings"
import { EditionsPanel } from "./editions-panel"
import { ResultsTab } from "./results-tab"
import { EmailTemplatesPanel } from "./email-templates-panel"
import { RemindersPanel } from "./reminders-panel"
import { DossierRemindersPanel } from "./dossier-reminders-panel"
import { VitrineSettings } from "./vitrine-settings"
import { RulesPanel } from "./rules-panel"
import { ApplicationDetailsDialog } from "./application-details-dialog"
import { EditApplicationDialog } from "./edit-application-dialog"
import { UploadDialog, type UploadTarget } from "./upload-dialog"
import { toast } from "sonner"

interface AdminDashboardProps {
  initialApplications: AdminApplicationDTO[]
  initialTimeSlots: TimeSlotDTO[]
  initialSeason: SeasonConfigDTO
  smtpConfigured: boolean
}

export function AdminDashboard({ initialApplications, initialTimeSlots, initialSeason, smtpConfigured }: AdminDashboardProps) {
  const [applications, setApplications] = useState(initialApplications)
  const [timeSlots, setTimeSlots] = useState(initialTimeSlots)
  const [season, setSeason] = useState(initialSeason)
  const [detailsApplication, setDetailsApplication] = useState<AdminApplicationDTO | null>(null)
  const [editApplication, setEditApplication] = useState<AdminApplicationDTO | null>(null)
  const [uploadTarget, setUploadTarget] = useState<UploadTarget | null>(null)

  const ageReferenceDate = getAgeReferenceDate(season)

  const refreshApplications = useCallback(async () => {
    try {
      const data = await apiJson<AdminApplicationDTO[]>(`/api/admin/applications?edition=${season.edition}`)
      setApplications(data)
      setDetailsApplication((current) => (current ? (data.find((a) => a.id === current.id) ?? null) : null))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de rafraîchir les candidatures")
    }
  }, [season.edition])

  const refreshTimeSlots = useCallback(async () => {
    try {
      setTimeSlots(await apiJson<TimeSlotDTO[]>(`/api/admin/time-slots?edition=${season.edition}`))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de rafraîchir les créneaux")
    }
  }, [season.edition])

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshApplications(), refreshTimeSlots()])
  }, [refreshApplications, refreshTimeSlots])

  const handleSeasonChange = useCallback(
    async (next: SeasonConfigDTO) => {
      setSeason(next)
      if (next.edition !== season.edition) {
        // Nouvelle saison : la vue courante repart de zéro (chargement explicite de la nouvelle édition).
        const [apps, slots] = await Promise.all([
          apiJson<AdminApplicationDTO[]>(`/api/admin/applications?edition=${next.edition}`).catch(() => []),
          apiJson<TimeSlotDTO[]>(`/api/admin/time-slots?edition=${next.edition}`).catch(() => []),
        ])
        setApplications(apps)
        setTimeSlots(slots)
      }
    },
    [season.edition],
  )

  const handleTrackingChange = useCallback((applicationId: string, tracking: AuditionTrackingDTO) => {
    setApplications((apps) => apps.map((app) => (app.id === applicationId ? { ...app, audition_tracking: tracking } : app)))
  }, [])

  const handleFinalistChange = useCallback((applicationId: string, isFinalist: boolean) => {
    setApplications((apps) => apps.map((app) => (app.id === applicationId ? { ...app, is_finalist: isFinalist } : app)))
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Image src="/images/design-mode/logo_sans_fond.png" alt="Tremplin Jeunes en Scène" width={120} height={48} className="h-12 w-auto" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Administration</h1>
              <p className="text-sm text-muted-foreground">Édition {season.edition}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {!smtpConfigured && (
          <div className="mb-6 rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-900">
            L&#39;envoi d&#39;emails n&#39;est pas configuré : renseignez les paramètres SMTP dans l&#39;onglet Paramètres.
          </div>
        )}

        <Tabs defaultValue="applications" className="space-y-6">
          <TabsList className="grid h-auto w-full max-w-4xl grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="applications">Candidatures</TabsTrigger>
            <TabsTrigger value="schedule">Créneaux</TabsTrigger>
            <TabsTrigger value="auditions">Mode Auditions</TabsTrigger>
            <TabsTrigger value="results">Résultats</TabsTrigger>
            <TabsTrigger value="vitrine">Site vitrine</TabsTrigger>
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
          </TabsList>

          <TabsContent value="applications">
            <ApplicationsTab
              applications={applications}
              season={season}
              ageReferenceDate={ageReferenceDate}
              onRefresh={refreshApplications}
              onOpenDetails={setDetailsApplication}
              onOpenEdit={setEditApplication}
            />
          </TabsContent>

          <TabsContent value="schedule">
            <ScheduleTab
              applications={applications}
              timeSlots={timeSlots}
              season={season}
              onRefresh={refreshAll}
              onSeasonChange={handleSeasonChange}
            />
          </TabsContent>

          <TabsContent value="auditions">
            <AuditionsTab
              applications={applications}
              timeSlots={timeSlots}
              auditionDates={season.audition_dates}
              onTrackingChange={handleTrackingChange}
            />
          </TabsContent>

          <TabsContent value="results">
            <ResultsTab
              applications={applications}
              season={season}
              smtpConfigured={smtpConfigured}
              onFinalistChange={handleFinalistChange}
              onRefresh={refreshApplications}
            />
          </TabsContent>

          <TabsContent value="vitrine">
            <VitrineSettings currentEdition={season.edition} />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <SeasonSettings season={season} timeSlots={timeSlots} onSeasonChange={handleSeasonChange} onSlotsChange={refreshTimeSlots} />
            <RulesPanel />
            <SmtpSettings />
            <EmailTemplatesPanel smtpConfigured={smtpConfigured} />
            <DossierRemindersPanel
              applications={applications}
              season={season}
              ageReferenceDate={ageReferenceDate}
              onSeasonChange={handleSeasonChange}
            />
            <RemindersPanel applications={applications} season={season} smtpConfigured={smtpConfigured} onRefresh={refreshApplications} />
            <EditionsPanel currentEdition={season.edition} />
          </TabsContent>
        </Tabs>
      </main>

      <ApplicationDetailsDialog
        application={detailsApplication}
        ageReferenceDate={ageReferenceDate}
        onClose={() => setDetailsApplication(null)}
        onUpload={setUploadTarget}
      />
      <EditApplicationDialog application={editApplication} onClose={() => setEditApplication(null)} onSaved={refreshApplications} />
      <UploadDialog target={uploadTarget} onClose={() => setUploadTarget(null)} onUploaded={refreshApplications} />
    </div>
  )
}
