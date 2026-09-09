"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  FileCheck,
  FileSpreadsheet,
  FileX,
  FolderArchive,
  Music,
  Pencil,
  Search,
  Users,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { AdminApplicationDTO } from "@/lib/admin-data"
import type { SeasonConfigDTO } from "@/lib/season-config"
import { apiJson, formatTime, getMinorMembers, getMissingDocuments, getMissingParentalAuths, hasTechnicalSheet } from "@/lib/admin-client"
import { formatDateFr } from "@/lib/season"
import { StatusBadge } from "./status-badge"

export function ApplicationsTab({
  applications,
  season,
  ageReferenceDate,
  onRefresh,
  onOpenDetails,
  onOpenEdit,
}: {
  applications: AdminApplicationDTO[]
  season: SeasonConfigDTO
  ageReferenceDate: string
  onRefresh: () => Promise<void>
  onOpenDetails: (application: AdminApplicationDTO) => void
  onOpenEdit: (application: AdminApplicationDTO) => void
}) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [isExportingExcel, setIsExportingExcel] = useState(false)
  const [isDownloadingZip, setIsDownloadingZip] = useState(false)

  const filtered = applications.filter((app) => {
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      app.stage_name.toLowerCase().includes(term) ||
      app.profile?.first_name?.toLowerCase().includes(term) ||
      app.profile?.last_name?.toLowerCase().includes(term) ||
      app.musical_style.toLowerCase().includes(term)
    const matchesStatus = statusFilter === "all" || app.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: applications.filter((app) => app.status !== "rejected").length,
    validated: applications.filter((app) => app.status === "validated").length,
    scheduled: applications.filter((app) => app.time_slot_id).length,
  }

  const updateStatus = async (application: AdminApplicationDTO, newStatus: string) => {
    if (newStatus === "validated") {
      const missing = getMissingDocuments(application, ageReferenceDate)
      if (missing.length > 0) {
        toast.error("Documents manquants", { description: missing.join(" · ") })
        return
      }
    }
    setUpdatingId(application.id)
    try {
      const result = await apiJson<{ emailSent?: boolean }>("/api/admin/applications/status", {
        method: "PUT",
        body: JSON.stringify({ applicationId: application.id, status: newStatus }),
      })
      await onRefresh()
      if (newStatus === "validated") {
        toast.success("Candidature validée", {
          description: result.emailSent ? "Le candidat a été prévenu par email." : "L'email de confirmation n'a pas pu être envoyé (vérifiez la configuration SMTP).",
        })
      } else {
        toast.success("Statut mis à jour")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la mise à jour du statut")
    } finally {
      setUpdatingId(null)
    }
  }

  const exportToExcel = async () => {
    setIsExportingExcel(true)
    try {
      const data = await apiJson<Record<string, unknown>[]>(`/api/applications/export?edition=${season.edition}`)
      const XLSX = await import("xlsx")
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Candidatures")
      XLSX.writeFile(wb, `candidatures_${season.edition}_${new Date().toISOString().split("T")[0]}.xlsx`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'export Excel")
    } finally {
      setIsExportingExcel(false)
    }
  }

  const downloadAllTechnicalSheets = async () => {
    setIsDownloadingZip(true)
    try {
      const sheets = await apiJson<Array<{ stageName: string; url: string }>>(
        `/api/technical-sheets/download-all?edition=${season.edition}`,
      )
      if (sheets.length === 0) {
        toast.info("Aucune fiche technique disponible")
        return
      }
      const JSZip = (await import("jszip")).default
      const zip = new JSZip()
      let failures = 0
      for (const sheet of sheets) {
        try {
          const pdfResponse = await fetch(sheet.url)
          if (!pdfResponse.ok) throw new Error(`HTTP ${pdfResponse.status}`)
          const pdfBlob = await pdfResponse.blob()
          const sanitizedName = sheet.stageName.replace(/[^a-z0-9]/gi, "_").toLowerCase()
          zip.file(`${sanitizedName}.pdf`, pdfBlob)
        } catch (error) {
          failures++
          console.error(`Error downloading sheet for ${sheet.stageName}:`, error)
        }
      }
      const zipBlob = await zip.generateAsync({ type: "blob" })
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = `fiches_techniques_${season.edition}_${new Date().toISOString().split("T")[0]}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      if (failures > 0) toast.warning(`${failures} fiche(s) n'ont pas pu être téléchargées`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la création du fichier ZIP")
    } finally {
      setIsDownloadingZip(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Candidatures (édition {season.edition})</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Validées
            </CardDescription>
            <CardTitle className="text-3xl text-green-700">{stats.validated}</CardTitle>
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
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Aucune candidature trouvée</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((application) => {
            const technicalSheetOk = hasTechnicalSheet(application)
            const minors = getMinorMembers(application, ageReferenceDate)
            const missingAuths = getMissingParentalAuths(application, ageReferenceDate)
            const allDocsPresent = technicalSheetOk && missingAuths.length === 0
            const isUpdating = updatingId === application.id

            return (
              <Card key={application.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-bold text-foreground">{application.stage_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {application.profile?.first_name || "N/A"} {application.profile?.last_name || ""}
                          </p>
                        </div>
                        <StatusBadge status={application.status} />
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
                        {application.time_slot && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-accent" />
                            <span className="text-accent font-medium">
                              {formatDateFr(application.time_slot.date, { weekday: false })} à {formatTime(application.time_slot.start_time)}
                              {!season.is_validated && <span className="text-muted-foreground font-normal"> (brouillon)</span>}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {technicalSheetOk ? (
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
                        {minors.length > 0 &&
                          (missingAuths.length === 0 ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <FileCheck className="h-3 w-3 mr-1" />
                              Autorisations parentales ({minors.length})
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
                            onClick={() => updateStatus(application, "validated")}
                            disabled={isUpdating || !allDocsPresent}
                            className="bg-primary hover:bg-primary/90"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {isUpdating ? "..." : "Valider"}
                          </Button>
                          {!allDocsPresent && <p className="text-xs text-red-600 text-center">Documents manquants</p>}
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => updateStatus(application, "pending")}
                          disabled={isUpdating}
                          size="sm"
                          className="text-xs"
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          Remettre en attente
                        </Button>
                      )}
                      {application.status === "pending" && (
                        <Button
                          variant="outline"
                          onClick={() => updateStatus(application, "rejected")}
                          disabled={isUpdating}
                          size="sm"
                          className="text-xs text-red-700"
                        >
                          Refuser
                        </Button>
                      )}
                      <Button variant="outline" onClick={() => onOpenEdit(application)} size="sm" className="text-xs">
                        <Pencil className="h-3 w-3 mr-1" />
                        Éditer
                      </Button>
                      <Button variant="outline" onClick={() => onOpenDetails(application)} size="sm" className="text-xs">
                        <Eye className="h-3 w-3 mr-1" />
                        Détails
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
