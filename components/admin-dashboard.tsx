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
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
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
  FileSpreadsheet,
  FolderArchive,
  Upload,
  Pencil,
  Plus,
  Trash2,
  Save,
  X,
  UserCheck,
  ClipboardCheck,
  Mic,
  MessageSquare,
  ChevronDown,
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
    city: string // Fixed: Added missing string type
    postal_code: string // Fixed: No longer undeclared
    phone: string | null
    role: string
  } | null
  technical_sheets?: TechnicalSheet[]
  parental_authorizations?: ParentalAuthorization[]
  time_slots?: TimeSlot
  instagram?: string // Added field
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

interface AuditionTracking {
  id: string
  application_id: string
  has_arrived: boolean
  arrived_at: string | null
  is_checked_in: boolean
  checked_in_at: string | null
  has_performed: boolean
  performed_at: string | null
  notes: string | null
}

export function AdminDashboard({ applications: initialApplications }: AdminDashboardProps) {
  console.log("[v0] AdminDashboard received applications:", initialApplications.length)
  if (initialApplications.length > 0) {
    console.log("[v0] First application:", initialApplications[0])
    console.log("[v0] First application technical_sheets:", initialApplications[0].technical_sheets)
  }

  const router = useRouter()
  const [applications, setApplications] = useState<Application[]>(initialApplications)
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
  const [isExportingExcel, setIsExportingExcel] = useState(false)
  const [isDownloadingZip, setIsDownloadingZip] = useState(false)

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploadType, setUploadType] = useState<"technical" | "parental">("technical")
  const [uploadingApplication, setUploadingApplication] = useState<Application | null>(null)
  const [selectedMemberIndex, setSelectedMemberIndex] = useState<number>(0) // Renamed from uploadingMemberIndex
  const [uploadingMemberName, setUploadingMemberName] = useState<string | null>(null) // Added state for member name
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingApplication, setEditingApplication] = useState<Application | null>(null)
  const [editFormData, setEditFormData] = useState<{
    stage_name: string
    musical_style: string
    biography: string
    instagram: string
    has_original_composition: boolean
    is_sacem_registered: boolean
    has_stage_experience: boolean
    stage_experience_details: string
    group_members: any[]
  } | null>(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  // Audition tracking state
  const [auditionTracking, setAuditionTracking] = useState<Record<string, AuditionTracking>>({})
  const [auditionDateFilter, setAuditionDateFilter] = useState<string>("all")
  const [auditionStatusFilter, setAuditionStatusFilter] = useState<string>("all")
  const [auditionSearchTerm, setAuditionSearchTerm] = useState("")

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

  const loadAuditionTracking = async () => {
    const supabase = createClient()
    const { data, error } = await supabase.from("audition_tracking").select("*")
    if (data && !error) {
      const trackingMap: Record<string, AuditionTracking> = {}
      data.forEach((track) => {
        trackingMap[track.application_id] = track
      })
      setAuditionTracking(trackingMap)
    }
  }

  const updateAuditionStatusFull = async (
    applicationId: string,
    hasArrived: boolean,
    isCheckedIn: boolean,
    hasPerformed: boolean
  ) => {
    console.log("[v0] updateAuditionStatusFull called:", { applicationId, hasArrived, isCheckedIn, hasPerformed })
    const supabase = createClient()
    const now = new Date().toISOString()

    // Check if tracking record exists
    const existingTracking = auditionTracking[applicationId]
    console.log("[v0] Existing tracking:", existingTracking)

    const updateData = {
      has_arrived: hasArrived,
      arrived_at: hasArrived ? (existingTracking?.arrived_at || now) : null,
      is_checked_in: isCheckedIn,
      checked_in_at: isCheckedIn ? (existingTracking?.checked_in_at || now) : null,
      has_performed: hasPerformed,
      performed_at: hasPerformed ? (existingTracking?.performed_at || now) : null,
      updated_at: now,
    }

    if (existingTracking) {
      // Update existing record
      console.log("[v0] Updating existing record...")
      const { error } = await supabase
        .from("audition_tracking")
        .update(updateData)
        .eq("application_id", applicationId)

      if (!error) {
        console.log("[v0] Update successful")
        setAuditionTracking((prev) => ({
          ...prev,
          [applicationId]: {
            ...prev[applicationId],
            ...updateData,
          },
        }))
      } else {
        console.log("[v0] Error updating audition tracking:", error)
      }
    } else {
      // Create new record
      console.log("[v0] Creating new record...")
      const { data, error } = await supabase
        .from("audition_tracking")
        .insert({
          application_id: applicationId,
          ...updateData,
        })
        .select()
        .single()

      if (!error && data) {
        console.log("[v0] Insert successful:", data)
        setAuditionTracking((prev) => ({
          ...prev,
          [applicationId]: data,
        }))
      } else {
        console.log("[v0] Error inserting audition tracking:", error)
      }
    }
  }

  const updateAuditionNotes = async (applicationId: string, notes: string) => {
    const supabase = createClient()
    const now = new Date().toISOString()

    const existingTracking = auditionTracking[applicationId]

    if (existingTracking) {
      const { error } = await supabase
        .from("audition_tracking")
        .update({ notes, updated_at: now })
        .eq("application_id", applicationId)

      if (!error) {
        setAuditionTracking((prev) => ({
          ...prev,
          [applicationId]: { ...prev[applicationId], notes },
        }))
      }
    } else {
      const { data, error } = await supabase
        .from("audition_tracking")
        .insert({ application_id: applicationId, notes })
        .select()
        .single()

      if (!error && data) {
        setAuditionTracking((prev) => ({
          ...prev,
          [applicationId]: data,
        }))
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
    const auditionDate = new Date("2026-01-31") // Assuming a fixed audition date for age calculation
    const birthDate = new Date(birthDateString)

    const diffMs = auditionDate.getTime() - birthDate.getTime()
    const ageYears = diffMs / (1000 * 60 * 60 * 24 * 365.25)

    return Math.round(ageYears * 10) / 10 // Round to 1 decimal place
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
    if (status === "rejected") {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <AlertCircle className="h-4 w-4 mr-1" />
          Refusée
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
    total: applications.filter((app) => app.status !== "rejected").length,
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

  const exportToExcel = async () => {
    setIsExportingExcel(true)
    try {
      const response = await fetch("/api/applications/export")
      const data = await response.json()

      // Import xlsx dynamically to reduce bundle size
      const XLSX = await import("xlsx")

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Candidatures")

      // Generate Excel file
      XLSX.writeFile(wb, `candidatures_${new Date().toISOString().split("T")[0]}.xlsx`)
    } catch (error) {
      console.error("Error exporting to Excel:", error)
      alert("Erreur lors de l'export Excel")
    }
    setIsExportingExcel(false)
  }

  const downloadAllTechnicalSheets = async () => {
    setIsDownloadingZip(true)
    try {
      const response = await fetch("/api/technical-sheets/download-all")
      const sheetsData = await response.json()

      if (sheetsData.length === 0) {
        alert("Aucune fiche technique disponible")
        setIsDownloadingZip(false)
        return
      }

      // Import JSZip dynamically
      const JSZip = (await import("jszip")).default

      const zip = new JSZip()

      // Download each PDF and add to zip
      for (const sheet of sheetsData) {
        try {
          const pdfResponse = await fetch(sheet.pdfUrl)
          const pdfBlob = await pdfResponse.blob()

          // Sanitize filename
          const sanitizedName = sheet.stageName.replace(/[^a-z0-9]/gi, "_").toLowerCase()
          zip.file(`${sanitizedName}.pdf`, pdfBlob)
        } catch (error) {
          console.error(`Error downloading sheet for ${sheet.stageName}:`, error)
        }
      }

      // Generate and download zip
      const zipBlob = await zip.generateAsync({ type: "blob" })
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = `fiches_techniques_${new Date().toISOString().split("T")[0]}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error creating zip:", error)
      alert("Erreur lors de la création du fichier ZIP")
    }
    setIsDownloadingZip(false)
  }

  const handleAdminUploadTechnicalSheet = async (file: File) => {
    if (!uploadingApplication) return

    try {
      setUploadError(null)
      console.log("[v0] Uploading technical sheet for application:", uploadingApplication.id)

      const formData = new FormData()
      formData.append("file", file)
      formData.append("applicationId", uploadingApplication.id)

      const response = await fetch("/api/admin/technical-sheet/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()
      console.log("[v0] Upload response:", result)

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de l'upload")
      }

      const supabase = createClient()

      // Wait a bit for database to propagate
      await new Promise((resolve) => setTimeout(resolve, 500))

      const { data: refreshedApp, error: fetchError } = await supabase
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
          technical_sheets (*),
          parental_authorizations (*),
          time_slots (*)
        `,
        )
        .eq("id", uploadingApplication.id)
        .single()

      console.log("[v0] Refreshed application:", refreshedApp)
      console.log("[v0] Fetch error:", fetchError)

      if (refreshedApp) {
        // Update state with refreshed data
        setApplications((prev) => prev.map((app) => (app.id === uploadingApplication.id ? refreshedApp : app)))
        setUploadingApplication(refreshedApp)
        if (selectedApplication?.id === uploadingApplication.id) {
          setSelectedApplication(refreshedApp)
        }
      }

      setUploadDialogOpen(false)
      alert("Document uploadé avec succès !")
    } catch (error) {
      console.error("[v0] Upload error:", error)
      setUploadError(error instanceof Error ? error.message : "Erreur lors de l'upload")
    } finally {
      setIsUploading(false)
    }
  }

  const handleAdminUploadParentalAuth = async (file: File) => {
    if (!uploadingApplication || selectedMemberIndex === null) return // Changed uploadingMemberIndex to selectedMemberIndex

    try {
      setUploadError(null)
      console.log(
        "[v0] Uploading parental auth for application:",
        uploadingApplication.id,
        "member:",
        selectedMemberIndex,
      )

      const memberName = uploadingMemberName || ""

      const formData = new FormData()
      formData.append("file", file)
      formData.append("applicationId", uploadingApplication.id)
      formData.append("memberIndex", selectedMemberIndex.toString()) // Changed to selectedMemberIndex
      formData.append("memberName", memberName)

      const response = await fetch("/api/admin/parental-authorization/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()
      console.log("[v0] Upload response:", result)

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de l'upload")
      }

      const supabase = createClient()

      // Wait a bit for database to propagate
      await new Promise((resolve) => setTimeout(resolve, 500))

      const { data: refreshedApp, error: fetchError } = await supabase
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
          technical_sheets (*),
          parental_authorizations (*),
          time_slots (*)
        `,
        )
        .eq("id", uploadingApplication.id)
        .single()

      console.log("[v0] Refreshed application:", refreshedApp)
      console.log("[v0] Fetch error:", fetchError)

      if (refreshedApp) {
        // Update state with refreshed data
        setApplications((prev) => prev.map((app) => (app.id === uploadingApplication.id ? refreshedApp : app)))
        setUploadingApplication(refreshedApp)
        if (selectedApplication?.id === uploadingApplication.id) {
          setSelectedApplication(refreshedApp)
        }
      }

      setUploadDialogOpen(false)
      alert("Document uploadé avec succès !")
    } catch (error) {
      console.error("[v0] Upload error:", error)
      setUploadError(error instanceof Error ? error.message : "Erreur lors de l'upload")
    } finally {
      setIsUploading(false)
    }
  }

  const handleAdminUpload = async (file: File) => {
    if (!uploadingApplication) return

    setIsUploading(true)
    setUploadError(null)

    try {
      // Determine upload type and call the appropriate handler
      if (uploadType === "technical") {
        await handleAdminUploadTechnicalSheet(file)
      } else {
        await handleAdminUploadParentalAuth(file)
      }
    } catch (error) {
      // Error is already set in the specific handlers, just ensure isUploading is reset if needed
      console.error("Error in handleAdminUpload:", error)
      setUploadError("Une erreur inattendue est survenue.") // Generic fallback error
    } finally {
      // isUploading is set to false within the specific handlers, so this might be redundant
      // but keeping it here for safety if handlers were modified.
      // However, the handlers now manage their own finally blocks.
    }
  }

  const openEditDialog = (application: Application) => {
    setEditingApplication(application)
    setEditFormData({
      stage_name: application.stage_name || "",
      musical_style: application.musical_style || "",
      biography: application.biography || "",
      instagram: application.instagram || "",
      has_original_composition: application.has_original_composition || false,
      is_sacem_registered: application.is_sacem_registered || false,
      has_stage_experience: application.has_stage_experience || false,
      stage_experience_details: application.stage_experience_details || "",
      group_members: application.group_members || [],
    })
    setIsEditDialogOpen(true)
  }

  const addGroupMember = () => {
    if (!editFormData) return
    setEditFormData({
      ...editFormData,
      group_members: [...editFormData.group_members, { firstName: "", lastName: "", birthDate: "" }],
    })
  }

  const removeGroupMember = (index: number) => {
    if (!editFormData) return
    const newMembers = editFormData.group_members.filter((_, i) => i !== index)
    setEditFormData({
      ...editFormData,
      group_members: newMembers,
    })
  }

  const updateGroupMember = (index: number, field: string, value: string) => {
    if (!editFormData) return
    const newMembers = [...editFormData.group_members]
    newMembers[index] = { ...newMembers[index], [field]: value }
    setEditFormData({
      ...editFormData,
      group_members: newMembers,
    })
  }

  const saveApplicationEdit = async () => {
    if (!editingApplication || !editFormData) return

    setIsSavingEdit(true)
    try {
      const response = await fetch("/api/admin/application/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: editingApplication.id,
          updates: editFormData,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la mise à jour")
      }

      // Refresh applications
      const supabase = createClient()
      const { data: refreshedApp } = await supabase
        .from("applications")
        .select(`
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
          technical_sheets (*),
          parental_authorizations (*),
          time_slots (*)
        `)
        .eq("id", editingApplication.id)
        .single()

      if (refreshedApp) {
        setApplications((prev) => prev.map((app) => (app.id === editingApplication.id ? refreshedApp : app)))
      }

      setIsEditDialogOpen(false)
      setEditingApplication(null)
      setEditFormData(null)
      alert("Candidature mise à jour avec succès !")
    } catch (error) {
      console.error("Error saving edit:", error)
      alert(error instanceof Error ? error.message : "Erreur lors de la mise à jour")
    } finally {
      setIsSavingEdit(false)
    }
  }

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
        <Tabs defaultValue="auditions" className="space-y-6">
          <TabsList className="grid w-full max-w-xl grid-cols-3">
            <TabsTrigger value="auditions">Mode Auditions</TabsTrigger>
            <TabsTrigger value="applications">Candidatures</TabsTrigger>
            <TabsTrigger value="schedule">Créneaux</TabsTrigger>
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
                        <SelectItem value="rejected">Refusées</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button onClick={exportToExcel} disabled={isExportingExcel} variant="outline" size="sm">
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    {isExportingExcel ? "Export en cours..." : "Exporter en Excel"}
                  </Button>
                  <Button onClick={downloadAllTechnicalSheets} disabled={isDownloadingZip} variant="outline" size="sm">
                    <FolderArchive className="h-4 w-4 mr-2" />
                    {isDownloadingZip ? "Téléchargement..." : "Télécharger toutes les fiches techniques (ZIP)"}
                  </Button>
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
                          <div className="flex flex-wrap gap-2">
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
                                size="sm"
                                className="text-xs"
                              >
                                <Clock className="h-3 w-3 mr-1" />
                                Remettre en attente
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              onClick={() => openEditDialog(application)}
                              size="sm"
                              className="text-xs"
                            >
                              <Pencil className="h-3 w-3 mr-1" />
                              Éditer
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  onClick={() => setSelectedApplication(application)}
                                  size="sm"
                                  className="text-xs"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
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
                                      {application.instagram && (
                                        <p>
                                          <span className="text-muted-foreground">Instagram:</span>{" "}
                                          <a
                                            href={`https://instagram.com/${application.instagram.replace("@", "")}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline"
                                          >
                                            @{application.instagram.replace("@", "")}
                                          </a>
                                        </p>
                                      )}
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
                                    <div className="flex items-center justify-between">
                                      <h4 className="font-semibold">Fiche technique</h4>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setUploadType("technical")
                                          setUploadingApplication(application)
                                          setUploadDialogOpen(true)
                                        }}
                                      >
                                        <Upload className="h-4 w-4 mr-2" />
                                        {application.technical_sheets && application.technical_sheets[0]?.pdf_url
                                          ? "Remplacer"
                                          : "Ajouter"}
                                      </Button>
                                    </div>
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
                                            {minors.map((minor, index) => {
                                              const auth = auths.find((a) => a.member_index === minor.index)
                                              return (
                                                <div key={minor.index} className="p-3 border rounded-lg bg-muted/30">
                                                  <div className="flex items-center justify-between mb-2">
                                                    <p className="text-sm font-medium">
                                                      {minor.firstName} {minor.lastName}
                                                    </p>
                                                    <Button
                                                      variant="outline"
                                                      size="sm"
                                                      onClick={() => {
                                                        setUploadType("parental")
                                                        setUploadingApplication(application)
                                                        setSelectedMemberIndex(index) // Set the correct index
                                                        setUploadingMemberName(`${minor.firstName} ${minor.lastName}`) // Set the member name
                                                        setUploadDialogOpen(true)
                                                      }}
                                                    >
                                                      <Upload className="h-4 w-4 mr-2" />
                                                      {auth?.pdf_url ? "Remplacer" : "Ajouter"}
                                                    </Button>
                                                  </div>
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

          <TabsContent value="auditions" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Mic className="h-5 w-5" />
                      Mode Auditions - Suivi du jour J
                    </CardTitle>
                    <CardDescription>
                      Suivez les arrivées et passages des candidats devant le jury
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-300" />
                      <span>Non arrivé</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <span>Arrivé</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-400" />
                      <span>Prêt à passer</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span>Passé</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2 rounded bg-muted">
                    <div className="text-xl font-bold">
                      {applications.filter((app) => app.time_slot_id).length}
                    </div>
                    <div className="text-xs text-muted-foreground">Attendus</div>
                  </div>
                  <div className="p-2 rounded bg-yellow-100">
                    <div className="text-xl font-bold text-yellow-700">
                      {Object.values(auditionTracking).filter((t) => t.has_arrived && !t.has_performed).length}
                    </div>
                    <div className="text-xs text-yellow-700">Arrivés</div>
                  </div>
                  <div className="p-2 rounded bg-blue-100">
                    <div className="text-xl font-bold text-blue-700">
                      {Object.values(auditionTracking).filter((t) => t.is_checked_in && !t.has_performed).length}
                    </div>
                    <div className="text-xs text-blue-700">Prêts</div>
                  </div>
                  <div className="p-2 rounded bg-green-100">
                    <div className="text-xl font-bold text-green-700">
                      {Object.values(auditionTracking).filter((t) => t.has_performed).length}
                    </div>
                    <div className="text-xs text-green-700">Passés</div>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher un candidat..."
                        value={auditionSearchTerm}
                        onChange={(e) => setAuditionSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={auditionDateFilter} onValueChange={setAuditionDateFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les dates</SelectItem>
                      <SelectItem value="2026-01-31">31 janvier 2026</SelectItem>
                      <SelectItem value="2026-02-01">1er février 2026</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={auditionStatusFilter} onValueChange={setAuditionStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="not_arrived">Non arrivés</SelectItem>
                      <SelectItem value="arrived">Arrivés</SelectItem>
                      <SelectItem value="checked_in">Prêts à passer</SelectItem>
                      <SelectItem value="performed">Passés</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Candidates list */}
                <div className="space-y-1">
                  {applications
                    .filter((app) => app.time_slot_id)
                    .filter((app) => {
                      if (auditionDateFilter !== "all") {
                        const slot = timeSlots.find((s) => s.id === app.time_slot_id)
                        if (slot?.date !== auditionDateFilter) return false
                      }
                      if (auditionStatusFilter !== "all") {
                        const tracking = auditionTracking[app.id]
                        switch (auditionStatusFilter) {
                          case "not_arrived":
                            return !tracking?.has_arrived
                          case "arrived":
                            return tracking?.has_arrived && !tracking?.is_checked_in
                          case "checked_in":
                            return tracking?.is_checked_in && !tracking?.has_performed
                          case "performed":
                            return tracking?.has_performed
                        }
                      }
                      if (auditionSearchTerm) {
                        const search = auditionSearchTerm.toLowerCase()
                        return (
                          app.stage_name?.toLowerCase().includes(search) ||
                          app.profiles?.first_name?.toLowerCase().includes(search) ||
                          app.profiles?.last_name?.toLowerCase().includes(search)
                        )
                      }
                      return true
                    })
                    .sort((a, b) => {
                      const slotA = timeSlots.find((s) => s.id === a.time_slot_id)
                      const slotB = timeSlots.find((s) => s.id === b.time_slot_id)
                      if (!slotA || !slotB) return 0
                      if (slotA.date !== slotB.date) return slotA.date.localeCompare(slotB.date)
                      return slotA.start_time.localeCompare(slotB.start_time)
                    })
                    .map((app) => {
                      const tracking = auditionTracking[app.id]
                      const slot = timeSlots.find((s) => s.id === app.time_slot_id)
                      
                      let statusColor = "bg-gray-300"
                      if (tracking?.has_performed) {
                        statusColor = "bg-green-500"
                      } else if (tracking?.is_checked_in) {
                        statusColor = "bg-blue-400"
                      } else if (tracking?.has_arrived) {
                        statusColor = "bg-yellow-400"
                      }

                      const getCurrentStatus = () => {
                        if (tracking?.has_performed) return "performed"
                        if (tracking?.is_checked_in) return "ready"
                        if (tracking?.has_arrived) return "arrived"
                        return "not_arrived"
                      }

                      const handleStatusChange = (newStatus: string) => {
                        if (newStatus === "not_arrived") {
                          updateAuditionStatusFull(app.id, false, false, false)
                        } else if (newStatus === "arrived") {
                          updateAuditionStatusFull(app.id, true, false, false)
                        } else if (newStatus === "ready") {
                          updateAuditionStatusFull(app.id, true, true, false)
                        } else if (newStatus === "performed") {
                          updateAuditionStatusFull(app.id, true, true, true)
                        }
                      }

                      return (
                        <div key={app.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 border-b last:border-b-0">
                          <div className={`w-3 h-3 rounded-full shrink-0 ${statusColor}`} />
                          <span className="text-xs font-mono w-12 shrink-0">
                            {slot ? formatTime(slot.start_time) : "—"}
                          </span>
                          <span className="font-medium text-sm truncate flex-1 min-w-0">{app.stage_name}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            <select
                              value={getCurrentStatus()}
                              onChange={(e) => {
                                console.log("[v0] Select onChange triggered, value:", e.target.value, "app.id:", app.id)
                                handleStatusChange(e.target.value)
                              }}
                              className="h-7 w-[130px] text-xs rounded border border-input bg-background px-2 focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                              <option value="not_arrived">Non arrivé</option>
                              <option value="arrived">Arrivé</option>
                              <option value="ready">Prêt à passer</option>
                              <option value="performed">Passé</option>
                            </select>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="ghost" className="h-7 px-2">
                                  <MessageSquare className="h-3 w-3" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Notes - {app.stage_name}</DialogTitle>
                                  <DialogDescription>
                                    Notes de l'organisateur pour ce candidat
                                  </DialogDescription>
                                </DialogHeader>
                                <Textarea
                                  placeholder="Notes internes (problèmes, retards, etc.)"
                                  defaultValue={tracking?.notes || ""}
                                  onBlur={(e) => updateAuditionNotes(app.id, e.target.value)}
                                  rows={4}
                                />
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      )
                    })}

                  {applications.filter((app) => app.time_slot_id).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Mic className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Aucun candidat avec un créneau attribué</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {uploadType === "technical"
                ? "Ajouter/Remplacer la fiche technique"
                : "Ajouter/Remplacer l'autorisation parentale"}
            </DialogTitle>
            <DialogDescription>
              {uploadType === "technical"
                ? "Uploadez la fiche technique reçue par email"
                : `Uploadez l'autorisation parentale pour ${uploadingApplication && getMinorMembers(uploadingApplication)[selectedMemberIndex]?.firstName} ${uploadingApplication && getMinorMembers(uploadingApplication)[selectedMemberIndex]?.lastName}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleAdminUpload(file)
                  }
                }}
                disabled={isUploading}
                className="w-full"
              />
            </div>
            {uploadError && <div className="text-sm text-red-600 bg-red-50 p-3 rounded">{uploadError}</div>}
            {isUploading && <div className="text-sm text-muted-foreground">Upload en cours...</div>}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Éditer la candidature</DialogTitle>
            <DialogDescription>
              Modifiez les informations de la candidature de {editingApplication?.stage_name}
            </DialogDescription>
          </DialogHeader>

          {editFormData && (
            <div className="space-y-6 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-stage-name">Nom de scène</Label>
                  <Input
                    id="edit-stage-name"
                    value={editFormData.stage_name}
                    onChange={(e) => setEditFormData({ ...editFormData, stage_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-musical-style">Style musical</Label>
                  <Input
                    id="edit-musical-style"
                    value={editFormData.musical_style}
                    onChange={(e) => setEditFormData({ ...editFormData, musical_style: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-instagram">Instagram</Label>
                <Input
                  id="edit-instagram"
                  value={editFormData.instagram}
                  onChange={(e) => setEditFormData({ ...editFormData, instagram: e.target.value })}
                  placeholder="@username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-biography">Biographie</Label>
                <Textarea
                  id="edit-biography"
                  value={editFormData.biography}
                  onChange={(e) => setEditFormData({ ...editFormData, biography: e.target.value })}
                  rows={5}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-original"
                    checked={editFormData.has_original_composition}
                    onCheckedChange={(checked) =>
                      setEditFormData({ ...editFormData, has_original_composition: !!checked })
                    }
                  />
                  <Label htmlFor="edit-original">Propose une composition originale</Label>
                </div>

                {editFormData.has_original_composition && (
                  <div className="flex items-center space-x-2 ml-6">
                    <Checkbox
                      id="edit-sacem"
                      checked={editFormData.is_sacem_registered || false}
                      onCheckedChange={(checked) =>
                        setEditFormData({ ...editFormData, is_sacem_registered: !!checked })
                      }
                    />
                    <Label htmlFor="edit-sacem">Inscrit à la SACEM</Label>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-experience"
                    checked={editFormData.has_stage_experience}
                    onCheckedChange={(checked) => setEditFormData({ ...editFormData, has_stage_experience: !!checked })}
                  />
                  <Label htmlFor="edit-experience">A une expérience scénique</Label>
                </div>

                {editFormData.has_stage_experience && (
                  <div className="space-y-2 ml-6">
                    <Label htmlFor="edit-experience-details">Détails de l'expérience</Label>
                    <Textarea
                      id="edit-experience-details"
                      value={editFormData.stage_experience_details}
                      onChange={(e) => setEditFormData({ ...editFormData, stage_experience_details: e.target.value })}
                      rows={3}
                    />
                  </div>
                )}
              </div>

              {/* Group members section */}
              {editingApplication?.application_type === "group" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Membres du groupe</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addGroupMember}>
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter un membre
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {editFormData.group_members.map((member, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 grid gap-4 sm:grid-cols-3">
                            <div className="space-y-2">
                              <Label>Prénom</Label>
                              <Input
                                value={member.firstName || ""}
                                onChange={(e) => updateGroupMember(index, "firstName", e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Nom</Label>
                              <Input
                                value={member.lastName || ""}
                                onChange={(e) => updateGroupMember(index, "lastName", e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Date de naissance</Label>
                              <Input
                                type="date"
                                value={member.birthDate || ""}
                                onChange={(e) => updateGroupMember(index, "birthDate", e.target.value)}
                              />
                            </div>
                          </div>
                          {editFormData.group_members.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => removeGroupMember(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Solo artist birth date */}
              {editingApplication?.application_type === "solo" && editFormData.group_members.length > 0 && (
                <div className="space-y-2">
                  <Label>Date de naissance</Label>
                  <Input
                    type="date"
                    value={editFormData.group_members[0]?.birthDate || ""}
                    onChange={(e) => updateGroupMember(0, "birthDate", e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSavingEdit}>
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button onClick={saveApplicationEdit} disabled={isSavingEdit}>
              <Save className="h-4 w-4 mr-2" />
              {isSavingEdit ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
