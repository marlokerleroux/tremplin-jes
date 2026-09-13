"use client"

import { useState } from "react"
import { toast } from "sonner"
import { ListOrdered, Mic, Printer, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { AdminApplicationDTO, AuditionTrackingDTO, TimeSlotDTO } from "@/lib/admin-data"
import { apiJson, formatTime } from "@/lib/admin-client"
import { formatDateFr } from "@/lib/season"
import { candidateSheetsUrl, runningOrderUrl } from "@/lib/print-urls"
import { NoteDialog } from "./note-dialog"

type AuditionStatus = "not_arrived" | "arrived" | "ready" | "performed"

function statusOf(tracking: AuditionTrackingDTO | null): AuditionStatus {
  if (tracking?.has_performed) return "performed"
  if (tracking?.is_checked_in) return "ready"
  if (tracking?.has_arrived) return "arrived"
  return "not_arrived"
}

const STATUS_LABELS: Record<AuditionStatus, string> = {
  not_arrived: "Non arrivé",
  arrived: "Arrivé",
  ready: "Prêt à passer",
  performed: "Passé",
}

const STATUS_COLORS: Record<AuditionStatus, string> = {
  not_arrived: "bg-gray-300",
  arrived: "bg-yellow-400",
  ready: "bg-blue-400",
  performed: "bg-green-500",
}

export function AuditionsTab({
  applications,
  timeSlots,
  auditionDates,
  onTrackingChange,
}: {
  applications: AdminApplicationDTO[]
  timeSlots: TimeSlotDTO[]
  auditionDates: string[]
  onTrackingChange: (applicationId: string, tracking: AuditionTrackingDTO) => void
}) {
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")

  const slotById = new Map(timeSlots.map((s) => [s.id, s]))
  const scheduled = applications.filter((app) => app.time_slot_id && app.status !== "rejected")
  // Union des dates configurées et des dates portant des créneaux (un créneau attribué reste visible même si sa date a été retirée).
  const dates = Array.from(new Set([...auditionDates, ...timeSlots.map((s) => s.date)])).sort()

  const counts = {
    expected: scheduled.length,
    arrived: scheduled.filter((a) => statusOf(a.audition_tracking) === "arrived").length,
    ready: scheduled.filter((a) => statusOf(a.audition_tracking) === "ready").length,
    performed: scheduled.filter((a) => statusOf(a.audition_tracking) === "performed").length,
  }

  const updateStatus = async (app: AdminApplicationDTO, newStatus: AuditionStatus) => {
    const flags = {
      hasArrived: newStatus !== "not_arrived",
      isCheckedIn: newStatus === "ready" || newStatus === "performed",
      hasPerformed: newStatus === "performed",
    }
    try {
      const result = await apiJson<{ data: AuditionTrackingDTO }>("/api/admin/audition-tracking", {
        method: "POST",
        body: JSON.stringify({ applicationId: app.id, ...flags }),
      })
      onTrackingChange(app.id, result.data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la mise à jour du statut")
    }
  }

  const updateNotes = async (app: AdminApplicationDTO, notes: string) => {
    try {
      const result = await apiJson<{ data: AuditionTrackingDTO }>("/api/admin/audition-tracking", {
        method: "PATCH",
        body: JSON.stringify({ applicationId: app.id, notes }),
      })
      onTrackingChange(app.id, result.data)
      toast.success("Note enregistrée")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'enregistrement de la note")
      throw error
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Mode Auditions - Suivi du jour J
            </CardTitle>
            <CardDescription>Suivez les arrivées et passages des candidats devant le jury</CardDescription>
          </div>
          <div className="flex items-center gap-4 text-sm flex-wrap">
            {(Object.keys(STATUS_LABELS) as AuditionStatus[]).map((status) => (
              <div key={status} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${STATUS_COLORS[status]}`} />
                <span>{STATUS_LABELS[status]}</span>
              </div>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          <div className="p-2 rounded bg-muted">
            <div className="text-xl font-bold">{counts.expected}</div>
            <div className="text-xs text-muted-foreground">Attendus</div>
          </div>
          <div className="p-2 rounded bg-yellow-100">
            <div className="text-xl font-bold text-yellow-700">{counts.arrived}</div>
            <div className="text-xs text-yellow-700">Arrivés</div>
          </div>
          <div className="p-2 rounded bg-blue-100">
            <div className="text-xl font-bold text-blue-700">{counts.ready}</div>
            <div className="text-xs text-blue-700">Prêts</div>
          </div>
          <div className="p-2 rounded bg-green-100">
            <div className="text-xl font-bold text-green-700">{counts.performed}</div>
            <div className="text-xs text-green-700">Passés</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <Label htmlFor="audition-search" className="sr-only">
              Rechercher un candidat
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="audition-search"
                placeholder="Rechercher un candidat..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[220px]" aria-label="Filtrer par date">
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les dates</SelectItem>
              {dates.map((date) => (
                <SelectItem key={date} value={date}>
                  {formatDateFr(date)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]" aria-label="Filtrer par statut">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {(Object.keys(STATUS_LABELS) as AuditionStatus[]).map((status) => (
                <SelectItem key={status} value={status}>
                  {STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {dates.map((date) => {
          if (dateFilter !== "all" && dateFilter !== date) return null
          const dayApplications = scheduled
            .filter((app) => slotById.get(app.time_slot_id!)?.date === date)
            .filter((app) => statusFilter === "all" || statusOf(app.audition_tracking) === statusFilter)
            .filter((app) => {
              if (!searchTerm) return true
              const term = searchTerm.toLowerCase()
              return (
                app.stage_name.toLowerCase().includes(term) ||
                app.profile?.first_name?.toLowerCase().includes(term) ||
                app.profile?.last_name?.toLowerCase().includes(term)
              )
            })
            .sort((a, b) => {
              const slotA = slotById.get(a.time_slot_id!)
              const slotB = slotById.get(b.time_slot_id!)
              if (!slotA || !slotB) return 0
              return slotA.start_time.localeCompare(slotB.start_time)
            })

          if (dayApplications.length === 0 && dateFilter === "all") return null

          return (
            <div key={date} className="space-y-2">
              <h3 className="font-semibold text-sm bg-muted px-3 py-2 rounded sticky top-0 flex flex-wrap items-center gap-2">
                <span>
                  {formatDateFr(date)}
                  <span className="ml-2 text-muted-foreground font-normal">
                    ({dayApplications.length} candidat{dayApplications.length > 1 ? "s" : ""})
                  </span>
                </span>
                <span className="ml-auto flex gap-1">
                  <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                    <a href={runningOrderUrl(date)} target="_blank" rel="noopener noreferrer">
                      <ListOrdered className="h-3 w-3 mr-1" />
                      Ordre de passage
                    </a>
                  </Button>
                  <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                    <a href={candidateSheetsUrl({ date })} target="_blank" rel="noopener noreferrer">
                      <Printer className="h-3 w-3 mr-1" />
                      Fiches jury
                    </a>
                  </Button>
                </span>
              </h3>
              <div className="space-y-1">
                {dayApplications.map((app) => {
                  const status = statusOf(app.audition_tracking)
                  const slot = slotById.get(app.time_slot_id!)
                  return (
                    <div key={app.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 border-b last:border-b-0">
                      <div className={`w-3 h-3 rounded-full shrink-0 ${STATUS_COLORS[status]}`} aria-hidden="true" />
                      <span className="text-xs font-mono w-12 shrink-0">{slot ? formatTime(slot.start_time) : "—"}</span>
                      <span className="font-medium text-sm truncate flex-1 min-w-0">{app.stage_name}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <label htmlFor={`audition-status-${app.id}`} className="sr-only">
                          Statut de {app.stage_name}
                        </label>
                        <select
                          id={`audition-status-${app.id}`}
                          value={status}
                          onChange={(e) => updateStatus(app, e.target.value as AuditionStatus)}
                          className="h-7 w-[130px] text-xs rounded border border-input bg-background px-2 focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          {(Object.keys(STATUS_LABELS) as AuditionStatus[]).map((s) => (
                            <option key={s} value={s}>
                              {STATUS_LABELS[s]}
                            </option>
                          ))}
                        </select>
                        <NoteDialog
                          stageName={app.stage_name}
                          currentNote={app.audition_tracking?.notes ?? null}
                          onSave={(note) => updateNotes(app, note)}
                        />
                      </div>
                    </div>
                  )
                })}
                {dayApplications.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground text-sm">Aucun candidat pour cette journée</div>
                )}
              </div>
            </div>
          )
        })}

        {scheduled.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Mic className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucun candidat avec un créneau attribué</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
