"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Music,
  Search,
  Eye,
  CheckCircle,
  Clock,
  LogOut,
  Users,
  Calendar,
  AlertCircle,
  Download,
  FileCheck,
  FileX,
} from "lucide-react"
import Image from "next/image"

interface TimeSlot {
  id: string
  date: string
  start_time: string
  end_time: string
  is_available: boolean
}

interface TechnicalSheet {
  id: string
  pdf_url: string | null
  validated: boolean
  validated_at: string | null
}

interface ParentalAuthorization {
  id: string
  pdf_url: string
  validated: boolean
  validated_at: string | null
  member_index: number // Added for mapping to group members
}

interface Application {
  id: string
  user_id: string
  application_type: string
  stage_name: string
  group_members: any
  biography: string
  musical_style: string
  has_original_composition: boolean
  is_sacem_registered: boolean | null
  allows_broadcast: boolean
  has_stage_experience: boolean
  stage_experience_details: string | null
  preferred_audition_date: string | null
  time_slot_id: string | null
  status: string
  created_at: string
  profiles: {
    first_name: string
    last_name: string
    email: string
    street_address: string
    city: string
    postal_code: string
    phone: string | null
    role: string
  } | null
  technical_sheets?: TechnicalSheet[]
  parental_authorizations?: ParentalAuthorization[]
  time_slots?: TimeSlot
}

interface AdminDashboardProps {
  applications: Application[]
}

interface ScheduleConfig {
  id: string
  is_validated: boolean
  validated_at: string | null
  validated_by?: string | null
}

interface SMTPConfig {
  id: string
  smtp_host: string
  smtp_port: number
  smtp_username: string
  smtp_password: string
  smtp_from_email: string
  smtp_from_name: string
  smtp_secure: boolean
}

export function AdminDashboard({ applications: initialApplications }: AdminDashboardProps) {
  console.log("[v0] AdminDashboard received applications:", initialApplications.length)
  if (initialApplications.length > 0) {
    console.log("[v0] First application:", initialApplications[0])
    console.log("[v0] First application technical_sheets:", initialApplications[0].technical_sheets)
  }

  const router = useRouter()
  const [applications, setApplications] = useState(initialApplications)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig | null>(null)
  const [smtpConfig, setSmtpConfig] = useState<SMTPConfig | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isSavingSMTP, setIsSavingSMTP] = useState(false)
  const [isTestingSMTP, setIsTestingSMTP] = useState(false)
  const [smtpTestResult, setSMTPTestResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    loadTimeSlots()
    loadScheduleConfig()
    loadSMTPConfig()
  }, [])

  const loadTimeSlots = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("time_slots")
      .select("*")
      .order("date", { ascending: true })
      .order("start_time", { ascending: true })

    if (data) {
      setTimeSlots(data)
    }
  }

  const loadScheduleConfig = async () => {
    const supabase = createClient()
    const { data } = await supabase.from("schedule_config").select("*").single()
    if (data) {
      setScheduleConfig(data)
    } else {
      // If no schedule_config exists, create one with default values
      const { data: createdConfig, error } = await supabase
        .from("schedule_config")
        .insert([{ is_validated: false }])
        .select("*")
        .single()
      if (!error && createdConfig) {
        setScheduleConfig(createdConfig)
      }
    }
  }

  const loadSMTPConfig = async () => {
    const supabase = createClient()
    const { data } = await supabase.from("smtp_config").select("*").single()
    if (data) {
      setSmtpConfig(data)
    } else {
      // If no smtp_config exists, create a default one
      const { data: createdConfig, error } = await supabase
        .from("smtp_config")
        .insert([
          {
            smtp_host: "",
            smtp_port: 587,
            smtp_username: "",
            smtp_password: "",
            smtp_from_email: "",
            smtp_from_name: "",
            smtp_secure: true,
          },
        ])
        .select("*")
        .single()
      if (!error && createdConfig) {
        setSmtpConfig(createdConfig)
      }
    }
  }

  const saveSMTPConfig = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!smtpConfig) return

    setIsSavingSMTP(true)
    const supabase = createClient()

    const { error } = await supabase
      .from("smtp_config")
      .update({
        smtp_host: smtpConfig.smtp_host,
        smtp_port: smtpConfig.smtp_port,
        smtp_username: smtpConfig.smtp_username,
        smtp_password: smtpConfig.smtp_password,
        smtp_from_email: smtpConfig.smtp_from_email,
        smtp_from_name: smtpConfig.smtp_from_name,
        smtp_secure: smtpConfig.smtp_secure,
        updated_at: new Date().toISOString(),
      })
      .eq("id", smtpConfig.id)

    if (!error) {
      alert("Paramètres SMTP enregistrés avec succès")
    } else {
      alert("Erreur lors de l'enregistrement des paramètres SMTP")
      console.error("SMTP save error:", error)
    }

    setIsSavingSMTP(false)
  }

  const testSMTPConfig = async () => {
    if (!smtpConfig) return

    setIsTestingSMTP(true)
    setSMTPTestResult(null)

    try {
      const response = await fetch("/api/smtp/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(smtpConfig),
      })

      const data = await response.json()
      setSMTPTestResult(data)
    } catch (error) {
      setSMTPTestResult({
        success: false,
        message: "Erreur lors du test de connexion SMTP",
      })
      console.error("SMTP test error:", error)
    }

    setIsTestingSMTP(false)
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const assignTimeSlot = async (applicationId: string, timeSlotId: string) => {
    setIsUpdating(true)
    const supabase = createClient()

    console.log("[v0] Assigning time slot:", { applicationId, timeSlotId })
    console.log("[v0] Schedule validated:", scheduleConfig?.is_validated)

    // Update application with time slot
    const { error: appError } = await supabase
      .from("applications")
      .update({ time_slot_id: timeSlotId })
      .eq("id", applicationId)

    // Mark time slot as unavailable
    const { error: slotError } = await supabase.from("time_slots").update({ is_available: false }).eq("id", timeSlotId)

    if (!appError && !slotError) {
      if (scheduleConfig?.is_validated) {
        console.log("[v0] Planning is validated, sending email...")
        try {
          const { data: appData } = await supabase
            .from("applications")
            .select("stage_name, user_id, profiles!applications_user_id_fkey(email, first_name, last_name)")
            .eq("id", applicationId)
            .single()

          const { data: slotData } = await supabase.from("time_slots").select("*").eq("id", timeSlotId).single()

          if (appData && appData.profiles && slotData) {
            const profile = appData.profiles as any
            console.log("[v0] Sending time slot email to:", profile.email)

            const response = await fetch("/api/email/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: "time_slot_assigned",
                email: profile.email,
                firstName: profile.first_name,
                lastName: profile.last_name,
                date: slotData.date,
                time: slotData.start_time,
                venue: "Espace Léo Ferré, Brest",
              }),
            })

            const result = await response.json()
            console.log("[v0] Email sent to", profile.email, "- result:", result)
          } else {
            console.log("[v0] Missing data for email:", {
              hasAppData: !!appData,
              hasProfiles: !!appData?.profiles,
              hasSlotData: !!slotData,
            })
          }
        } catch (emailError) {
          console.error("[v0] Failed to send time slot email:", emailError)
        }
      } else {
        console.log("[v0] Planning not validated, skipping email")
      }

      // Refresh data
      await loadTimeSlots()
      const { data: updatedApps } = await supabase
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
          ),
          technical_sheets(*),
          parental_authorizations(*)
        `,
        )
        .neq("profiles.role", "admin")
        .order("created_at", { ascending: false })

      if (updatedApps) {
        const { data: techSheets } = await supabase.from("technical_sheets").select("*")
        const { data: parentalAuths } = await supabase.from("parental_authorizations").select("*")

        const appsWithDocs = updatedApps.map((app) => ({
          ...app,
          technical_sheets: techSheets?.filter((ts) => ts.application_id === app.id) || [],
          parental_authorizations: parentalAuths?.filter((pa) => pa.application_id === app.id) || [],
        }))

        setApplications(appsWithDocs as Application[])
      }
    } else {
      console.error("Error assigning time slot:", { appError, slotError })
      alert("Erreur lors de l'attribution du créneau. Veuillez réessayer.")
    }

    setIsUpdating(false)
  }

  const removeTimeSlot = async (applicationId: string, timeSlotId: string) => {
    setIsUpdating(true)
    const supabase = createClient()

    const { error: appError } = await supabase
      .from("applications")
      .update({ time_slot_id: null })
      .eq("id", applicationId)

    const { error: slotError } = await supabase.from("time_slots").update({ is_available: true }).eq("id", timeSlotId)

    if (!appError && !slotError) {
      await loadTimeSlots()
      const { data: updatedApps } = await supabase
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
          ),
          technical_sheets(*),
          parental_authorizations(*)
        `,
        )
        .neq("profiles.role", "admin")
        .order("created_at", { ascending: false })

      if (updatedApps) {
        const { data: techSheets } = await supabase.from("technical_sheets").select("*")
        const { data: parentalAuths } = await supabase.from("parental_authorizations").select("*")

        const appsWithDocs = updatedApps.map((app) => ({
          ...app,
          technical_sheets: techSheets?.filter((ts) => ts.application_id === app.id) || [],
          parental_authorizations: parentalAuths?.filter((pa) => pa.application_id === app.id) || [],
        }))

        setApplications(appsWithDocs as Application[])
      }
    } else {
      console.error("Error removing time slot:", { appError, slotError })
      alert("Erreur lors du retrait du créneau. Veuillez réessayer.")
    }

    setIsUpdating(false)
  }

  const validateSchedule = async () => {
    setIsUpdating(true)
    const supabase = createClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return

    const { error } = await supabase.from("schedule_config").upsert(
      {
        id: scheduleConfig?.id || crypto.randomUUID(),
        is_validated: true,
        validated_at: new Date().toISOString(),
        validated_by: user.user.id,
      },
      {
        onConflict: "id",
      },
    )

    if (!error) {
      await loadScheduleConfig()

      // Get all applications with assigned time slots
      const applicationsWithSlots = applications.filter((app) => app.time_slot_id)
      console.log("[v0] Found", applicationsWithSlots.length, "applications with time slots")

      // Send email to each candidate
      for (const app of applicationsWithSlots) {
        try {
          if (!app.profiles || !app.time_slots) {
            console.log("[v0] Skipping app", app.id, "- missing profiles or time_slots")
            continue
          }

          console.log(
            "[v0] Sending email to:",
            app.profiles.email,
            "for slot:",
            app.time_slots.date,
            app.time_slots.start_time,
          )

          const response = await fetch("/api/email/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "time_slot_assigned",
              email: app.profiles.email,
              firstName: app.profiles.first_name,
              lastName: app.profiles.last_name,
              date: app.time_slots.date,
              time: app.time_slots.start_time,
              venue: "Espace Léo Ferré, Brest",
            }),
          })

          const result = await response.json()
          console.log("[v0] Email sent to", app.profiles.email, "- result:", result)
        } catch (emailError) {
          console.error("[v0] Failed to send email to", app.profiles?.email, ":", emailError)
        }
      }

      console.log("[v0] Finished sending all emails")
    } else {
      console.error("Error validating schedule:", error)
      alert("Erreur lors de la validation du planning. Veuillez réessayer.")
    }

    setIsUpdating(false)
  }

  const resetSchedule = async () => {
    setIsUpdating(true)
    const supabase = createClient()

    const { error } = await supabase.from("schedule_config").upsert(
      {
        id: scheduleConfig?.id || crypto.randomUUID(),
        is_validated: false,
        validated_at: null,
        validated_by: null,
      },
      {
        onConflict: "id",
      },
    )

    if (!error) {
      await loadScheduleConfig()
    } else {
      console.error("Error resetting schedule:", error)
      alert("Erreur lors de la réinitialisation du planning. Veuillez réessayer.")
    }

    setIsUpdating(false)
  }

  const calculateAgeAtAudition = (birthDateString: string) => {
    const auditionDate = new Date("2026-01-31")
    const birthDate = new Date(birthDateString)

    let age = auditionDate.getFullYear() - birthDate.getFullYear()
    const monthDiff = auditionDate.getMonth() - birthDate.getMonth()
    const dayDiff = auditionDate.getDate() - birthDate.getDate()

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age--
    }

    return age
  }

  const getMinorMembers = (application: Application) => {
    const auditionDate = new Date("2026-01-31") // Assuming a fixed audition date for age calculation
    const minors: Array<{ index: number; firstName: string; lastName: string; birthDate: string }> = []

    if (application.group_members) {
      const members = application.group_members as any[]
      members.forEach((member, index) => {
        if (member.birthDate) {
          const birthDate = new Date(member.birthDate)
          const ageAtAudition = auditionDate.getFullYear() - birthDate.getFullYear()
          const monthDiff = auditionDate.getMonth() - birthDate.getMonth()
          const dayDiff = auditionDate.getDate() - birthDate.getDate()
          const adjustedAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? ageAtAudition - 1 : ageAtAudition

          if (adjustedAge < 18) {
            minors.push({
              index,
              firstName: member.firstName,
              lastName: member.lastName,
              birthDate: member.birthDate,
            })
          }
        }
      })
    }

    return minors
  }

  const needsParentalAuth = (application: Application) => {
    return getMinorMembers(application).length > 0
  }

  const hasAllParentalAuths = (application: Application) => {
    const minors = getMinorMembers(application)
    if (minors.length === 0) return true

    const auths = application.parental_authorizations || []

    return minors.every((minor) => auths.some((auth) => auth.member_index === minor.index && auth.pdf_url))
  }

  const getMissingParentalAuths = (application: Application) => {
    const minors = getMinorMembers(application)
    const auths = application.parental_authorizations || []

    return minors.filter((minor) => !auths.some((auth) => auth.member_index === minor.index && auth.pdf_url))
  }

  const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
    if (newStatus === "validated") {
      const app = applications.find((a) => a.id === applicationId)
      if (app && !hasAllRequiredDocuments(app)) {
        const missing = getMissingDocuments(app)
        alert(`Impossible de valider la candidature. Documents manquants :\n- ${missing.join("\n- ")}`)
        return
      }
    }

    setIsUpdating(true)
    const supabase = createClient()

    const { error } = await supabase.from("applications").update({ status: newStatus }).eq("id", applicationId)

    if (!error) {
      setApplications(applications.map((app) => (app.id === applicationId ? { ...app, status: newStatus } : app)))

      if (newStatus === "validated") {
        try {
          const app = applications.find((a) => a.id === applicationId)
          if (app && app.profiles) {
            await fetch("/api/email/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: "application_validated",
                email: app.profiles.email,
                firstName: app.profiles.first_name,
                lastName: app.profiles.last_name,
              }),
            })
          }
        } catch (emailError) {
          console.error("Failed to send validation email:", emailError)
        }
      }
    } else {
      console.error("Error updating application status:", error)
      alert("Erreur lors de la mise à jour du statut de la candidature. Veuillez réessayer.")
    }

    setIsUpdating(false)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Non spécifiée"
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5) // HH:MM
  }

  const getStatusBadge = (status: string) => {
    if (status === "validated") {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-4 w-4 mr-1" />
          Validée
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
        <Clock className="h-4 w-4 mr-1" />
        En attente
      </Badge>
    )
  }

  const hasAllRequiredDocuments = (application: Application) => {
    const hasTechnicalSheet =
      application.technical_sheets &&
      application.technical_sheets.length > 0 &&
      application.technical_sheets[0]?.pdf_url

    const hasAllParentalAuthorizations = hasAllParentalAuths(application)

    return hasTechnicalSheet && hasAllParentalAuthorizations
  }

  const getMissingDocuments = (application: Application) => {
    const missing: string[] = []
    const hasTechnicalSheet =
      application.technical_sheets &&
      application.technical_sheets.length > 0 &&
      application.technical_sheets[0]?.pdf_url

    if (!hasTechnicalSheet) {
      missing.push("Fiche technique")
    }

    const missingAuths = getMissingParentalAuths(application)
    missingAuths.forEach((minor) => {
      missing.push(`Autorisation parentale pour ${minor.firstName} ${minor.lastName}`)
    })

    return missing
  }

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.stage_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.musical_style.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || app.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const stats = {
    total: applications.length,
    scheduled: applications.filter((app) => app.time_slot_id).length,
  }

  const timeSlotsByDate = timeSlots.reduce(
    (acc, slot) => {
      if (!acc[slot.date]) {
        acc[slot.date] = []
      }
      acc[slot.date].push(slot)
      return acc
    },
    {} as Record<string, TimeSlot[]>,
  )

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image
              src="/images/design-mode/logo_sans_fond.png"
              alt="Tremplin Musical Breton"
              width={120}
              height={48}
              className="h-12 w-auto"
            />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Administration</h1>
              <p className="text-sm text-muted-foreground">Gestion des candidatures</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <Tabs defaultValue="applications" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="applications">Candidatures</TabsTrigger>
            <TabsTrigger value="schedule">Créneaux de passage</TabsTrigger>
            <TabsTrigger value="smtp">Paramètres SMTP</TabsTrigger>
          </TabsList>

          <TabsContent value="applications" className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total candidatures</CardDescription>
                  <CardTitle className="text-3xl">{stats.total}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-accent" />
                    Créneaux attribués
                  </CardDescription>
                  <CardTitle className="text-3xl text-accent">{stats.scheduled}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor="search" className="sr-only">
                      Rechercher
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Rechercher par nom, artiste ou style..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="sm:w-48">
                    <Label htmlFor="status-filter" className="sr-only">
                      Filtrer par statut
                    </Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger id="status-filter">
                        <SelectValue placeholder="Tous les statuts" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="validated">Validées</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {filteredApplications.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">Aucune candidature trouvée</p>
                  </CardContent>
                </Card>
              ) : (
                filteredApplications.map((application) => {
                  const hasTechnicalSheet =
                    application.technical_sheets &&
                    application.technical_sheets.length > 0 &&
                    application.technical_sheets[0]?.pdf_url
                  const needsParental = needsParentalAuth(application)
                  const hasAllParentalAuthorizations = hasAllParentalAuths(application)
                  const missingAuths = getMissingParentalAuths(application)
                  const allDocsPresent = hasAllRequiredDocuments(application)

                  return (
                    <Card key={application.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3 className="text-xl font-bold text-foreground">{application.stage_name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {application.profiles?.first_name || "N/A"} {application.profiles?.last_name || ""}
                                </p>
                              </div>
                              {getStatusBadge(application.status)}
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <Music className="h-4 w-4 text-muted-foreground" />
                                <span>{application.musical_style}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span>{application.application_type === "solo" ? "Solo" : "Groupe"}</span>
                              </div>
                              {application.time_slots && scheduleConfig?.is_validated && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4 text-accent" />
                                  <span className="text-accent font-medium">
                                    {formatDate(application.time_slots.date)} à{" "}
                                    {formatTime(application.time_slots.start_time)}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {hasTechnicalSheet ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  <FileCheck className="h-3 w-3 mr-1" />
                                  Fiche technique
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                  <FileX className="h-3 w-3 mr-1" />
                                  Fiche technique manquante
                                </Badge>
                              )}
                              {needsParental &&
                                (hasAllParentalAuthorizations ? (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    <FileCheck className="h-3 w-3 mr-1" />
                                    Autorisations parentales ({getMinorMembers(application).length})
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                    <FileX className="h-3 w-3 mr-1" />
                                    {missingAuths.length} autorisation(s) manquante(s)
                                  </Badge>
                                ))}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {application.status === "pending" ? (
                              <div className="flex flex-col gap-2">
                                <Button
                                  variant="default"
                                  onClick={() => updateApplicationStatus(application.id, "validated")}
                                  disabled={isUpdating || !allDocsPresent}
                                  className="bg-primary hover:bg-primary/90"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Valider
                                </Button>
                                {!allDocsPresent && (
                                  <p className="text-xs text-red-600 text-center">Documents manquants</p>
                                )}
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                onClick={() => updateApplicationStatus(application.id, "pending")}
                                disabled={isUpdating}
                              >
                                <Clock className="h-4 w-4 mr-2" />
                                Remettre en attente
                              </Button>
                            )}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" onClick={() => setSelectedApplication(application)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Détails
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>{application.stage_name}</DialogTitle>
                                  <DialogDescription>Détails de la candidature</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-6">
                                  <div className="space-y-2">
                                    <h4 className="font-semibold">Contact</h4>
                                    <div className="text-sm space-y-1">
                                      <p>
                                        <span className="text-muted-foreground">Nom:</span>{" "}
                                        {application.profiles?.first_name || "N/A"}{" "}
                                        {application.profiles?.last_name || ""}
                                      </p>
                                      <p>
                                        <span className="text-muted-foreground">Email:</span>{" "}
                                        {application.profiles?.email || "N/A"}
                                      </p>
                                      {application.profiles?.phone && (
                                        <p>
                                          <span className="text-muted-foreground">Téléphone:</span>{" "}
                                          {application.profiles.phone}
                                        </p>
                                      )}
                                      <p>
                                        <span className="text-muted-foreground">Adresse:</span>{" "}
                                        {application.profiles?.street_address || "N/A"}
                                      </p>
                                      <p>
                                        <span className="text-muted-foreground">Ville:</span>{" "}
                                        {application.profiles?.postal_code || ""} {application.profiles?.city || "N/A"}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <h4 className="font-semibold">Informations générales</h4>
                                    <div className="text-sm space-y-1">
                                      <p>
                                        <span className="text-muted-foreground">Type:</span>{" "}
                                        {application.application_type === "solo" ? "Artiste solo" : "Groupe"}
                                      </p>
                                      {application.application_type === "solo" &&
                                        application.group_members &&
                                        application.group_members[0]?.birthDate && (
                                          <p>
                                            <span className="text-muted-foreground">Date de naissance:</span>{" "}
                                            {formatDate(application.group_members[0].birthDate)} (
                                            {calculateAgeAtAudition(application.group_members[0].birthDate)} ans au
                                            31/01/2026)
                                          </p>
                                        )}
                                      <p>
                                        <span className="text-muted-foreground">Genre musical:</span>{" "}
                                        {application.musical_style}
                                      </p>
                                      <p>
                                        <span className="text-muted-foreground">Date d'audition préférée:</span>{" "}
                                        {formatDate(application.preferred_audition_date)}
                                      </p>
                                    </div>
                                  </div>

                                  {application.application_type === "group" && application.group_members && (
                                    <div className="space-y-2">
                                      <h4 className="font-semibold">Membres du groupe</h4>
                                      <div className="grid sm:grid-cols-2 gap-2">
                                        {(application.group_members as any[]).map((member: any, index: number) => (
                                          <div key={index} className="p-2 bg-muted/50 rounded text-sm">
                                            <p className="font-medium">
                                              {member.firstName} {member.lastName}
                                            </p>
                                            <p className="text-muted-foreground">
                                              Né(e) le {formatDate(member.birthDate)}
                                            </p>
                                            <p className="text-muted-foreground">
                                              {calculateAgeAtAudition(member.birthDate)} ans au 31/01/2026
                                            </p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  <div className="space-y-2">
                                    <h4 className="font-semibold">Biographie</h4>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                      {application.biography}
                                    </p>
                                  </div>

                                  <div className="space-y-2">
                                    <h4 className="font-semibold">Informations complémentaires</h4>
                                    <div className="text-sm space-y-1">
                                      <p>
                                        <span className="text-muted-foreground">Composition originale:</span>{" "}
                                        {application.has_original_composition ? "Oui" : "Non"}
                                      </p>
                                      {application.has_original_composition && (
                                        <p>
                                          <span className="text-muted-foreground">SACEM:</span>{" "}
                                          {application.is_sacem_registered ? "Oui" : "Non"}
                                        </p>
                                      )}
                                      <p>
                                        <span className="text-muted-foreground">Autorise la diffusion:</span>{" "}
                                        {application.allows_broadcast ? "Oui" : "Non"}
                                      </p>
                                      <p>
                                        <span className="text-muted-foreground">Expérience scénique:</span>{" "}
                                        {application.has_stage_experience ? "Oui" : "Non"}
                                      </p>
                                    </div>
                                  </div>

                                  {application.has_stage_experience && application.stage_experience_details && (
                                    <div className="space-y-2">
                                      <h4 className="font-semibold">Détails de l'expérience scénique</h4>
                                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                        {application.stage_experience_details}
                                      </p>
                                    </div>
                                  )}

                                  <div className="space-y-2">
                                    <h4 className="font-semibold">Fiche technique</h4>
                                    {application.technical_sheets && application.technical_sheets[0]?.pdf_url ? (
                                      <a
                                        href={application.technical_sheets[0].pdf_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-primary hover:underline"
                                      >
                                        <Download className="h-4 w-4" />
                                        <span>Télécharger la fiche technique (PDF)</span>
                                      </a>
                                    ) : (
                                      <p className="text-sm text-muted-foreground">Aucune fiche technique envoyée</p>
                                    )}
                                  </div>

                                  {needsParentalAuth(application) && (
                                    <div className="space-y-2">
                                      <h4 className="font-semibold">Autorisations parentales</h4>
                                      {(() => {
                                        const minors = getMinorMembers(application)
                                        const auths = application.parental_authorizations || []

                                        if (minors.length === 0) {
                                          return null
                                        }

                                        return (
                                          <div className="space-y-3">
                                            {minors.map((minor) => {
                                              const auth = auths.find((a) => a.member_index === minor.index)
                                              return (
                                                <div key={minor.index} className="p-3 border rounded-lg bg-muted/30">
                                                  <p className="text-sm font-medium mb-2">
                                                    {minor.firstName} {minor.lastName}
                                                  </p>
                                                  {auth?.pdf_url ? (
                                                    <a
                                                      href={auth.pdf_url}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
                                                    >
                                                      <Download className="h-4 w-4" />
                                                      <span>Télécharger l'autorisation parentale (PDF)</span>
                                                    </a>
                                                  ) : (
                                                    <p className="text-sm text-red-600 font-medium">
                                                      ⚠️ Autorisation parentale obligatoire non fournie
                                                    </p>
                                                  )}
                                                </div>
                                              )
                                            })}
                                          </div>
                                        )
                                      })()}
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Gestion des créneaux d'audition</CardTitle>
                    <CardDescription>
                      Attribuez les créneaux en mode brouillon, puis validez le planning complet
                    </CardDescription>
                  </div>
                  {scheduleConfig?.is_validated ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Planning validé
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      <Clock className="h-4 w-4 mr-1" />
                      Mode brouillon
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!scheduleConfig?.is_validated && (
                  <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-blue-900 font-medium">Mode brouillon</p>
                      <p className="text-sm text-blue-700 mt-1">
                        Les créneaux attribués ne sont pas encore visibles par les candidats. Validez le planning
                        complet pour les rendre publics.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  {!scheduleConfig?.is_validated ? (
                    <Button onClick={validateSchedule} disabled={isUpdating} className="bg-primary hover:bg-primary/90">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Valider le planning complet
                    </Button>
                  ) : (
                    <Button onClick={resetSchedule} disabled={isUpdating} variant="outline">
                      Repasser en mode brouillon
                    </Button>
                  )}
                </div>

                <div className="space-y-6 pt-4">
                  {Object.entries(timeSlotsByDate).map(([date, slots]) => (
                    <div key={date} className="space-y-3">
                      <h3 className="text-lg font-semibold">{formatDate(date)}</h3>
                      <div className="grid gap-2">
                        {slots.map((slot) => {
                          const assignedApp = applications.find((app) => app.time_slot_id === slot.id)
                          return (
                            <Card key={slot.id} className={assignedApp ? "border-accent" : ""}>
                              <CardContent className="pt-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className="text-lg font-semibold text-accent">
                                      {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                    </div>
                                    {assignedApp ? (
                                      <div>
                                        <p className="font-medium">{assignedApp.stage_name}</p>
                                        <p className="text-sm text-muted-foreground">
                                          {assignedApp.profiles?.first_name || "N/A"}{" "}
                                          {assignedApp.profiles?.last_name || ""}
                                        </p>
                                      </div>
                                    ) : (
                                      <Badge variant="outline">Disponible</Badge>
                                    )}
                                  </div>
                                  {assignedApp ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => removeTimeSlot(assignedApp.id, slot.id)}
                                      disabled={isUpdating}
                                    >
                                      Retirer
                                    </Button>
                                  ) : (
                                    <Select
                                      onValueChange={(appId) => assignTimeSlot(appId, slot.id)}
                                      disabled={isUpdating}
                                    >
                                      <SelectTrigger className="w-64">
                                        <SelectValue placeholder="Attribuer à..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {applications
                                          .filter(
                                            (app) => !app.time_slot_id && app.stage_name && app.status !== "rejected",
                                          )
                                          .map((app) => (
                                            <SelectItem key={app.id} value={app.id}>
                                              {app.stage_name} ({app.profiles?.first_name || "N/A"}{" "}
                                              {app.profiles?.last_name || ""})
                                            </SelectItem>
                                          ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="smtp" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuration SMTP</CardTitle>
                <CardDescription>Configurez les paramètres SMTP pour l'envoi d'emails de notification</CardDescription>
              </CardHeader>
              <CardContent>
                {smtpConfig ? (
                  <form onSubmit={saveSMTPConfig} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="smtp_host">Serveur SMTP</Label>
                        <Input
                          id="smtp_host"
                          type="text"
                          placeholder="smtp.gmail.com"
                          value={smtpConfig.smtp_host}
                          onChange={(e) => setSmtpConfig({ ...smtpConfig, smtp_host: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtp_port">Port SMTP</Label>
                        <Input
                          id="smtp_port"
                          type="number"
                          placeholder="587"
                          value={smtpConfig.smtp_port}
                          onChange={(e) => setSmtpConfig({ ...smtpConfig, smtp_port: Number.parseInt(e.target.value) })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="smtp_username">Nom d'utilisateur</Label>
                        <Input
                          id="smtp_username"
                          type="text"
                          placeholder="votre-email@example.com"
                          value={smtpConfig.smtp_username}
                          onChange={(e) => setSmtpConfig({ ...smtpConfig, smtp_username: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtp_password">Mot de passe</Label>
                        <Input
                          id="smtp_password"
                          type="password"
                          placeholder="••••••••"
                          value={smtpConfig.smtp_password}
                          onChange={(e) => setSmtpConfig({ ...smtpConfig, smtp_password: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="smtp_from_email">Email expéditeur</Label>
                        <Input
                          id="smtp_from_email"
                          type="email"
                          placeholder="noreply@example.com"
                          value={smtpConfig.smtp_from_email}
                          onChange={(e) => setSmtpConfig({ ...smtpConfig, smtp_from_email: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtp_from_name">Nom de l'expéditeur</Label>
                        <Input
                          id="smtp_from_name"
                          type="text"
                          placeholder="Tremplin Musical Breton"
                          value={smtpConfig.smtp_from_name}
                          onChange={(e) => setSmtpConfig({ ...smtpConfig, smtp_from_name: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="smtp_secure"
                        checked={smtpConfig.smtp_secure}
                        onChange={(e) => setSmtpConfig({ ...smtpConfig, smtp_secure: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor="smtp_secure" className="cursor-pointer">
                        Utiliser SSL/TLS (recommandé)
                      </Label>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-yellow-900 font-medium">Note de sécurité</p>
                        <p className="text-sm text-yellow-700 mt-1">
                          Les mots de passe sont stockés de manière sécurisée. Pour Gmail, utilisez un mot de passe
                          d'application plutôt que votre mot de passe principal.
                        </p>
                      </div>
                    </div>

                    {smtpTestResult && (
                      <div
                        className={`flex items-start gap-3 p-4 rounded-lg ${
                          smtpTestResult.success
                            ? "bg-green-50 border border-green-200"
                            : "bg-red-50 border border-red-200"
                        }`}
                      >
                        {smtpTestResult.success ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p
                            className={`text-sm font-medium ${
                              smtpTestResult.success ? "text-green-900" : "text-red-900"
                            }`}
                          >
                            {smtpTestResult.success ? "Test réussi" : "Test échoué"}
                          </p>
                          <p className={`text-sm mt-1 ${smtpTestResult.success ? "text-green-700" : "text-red-700"}`}>
                            {smtpTestResult.message}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={testSMTPConfig}
                        disabled={isTestingSMTP || isSavingSMTP}
                      >
                        {isTestingSMTP ? "Test en cours..." : "Tester l'envoi"}
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSavingSMTP || isTestingSMTP}
                        className="bg-primary hover:bg-primary/90"
                      >
                        {isSavingSMTP ? "Enregistrement..." : "Enregistrer les paramètres"}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <p className="text-muted-foreground">Chargement des paramètres...</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
