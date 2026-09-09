"use client"

import { useState } from "react"
import { toast } from "sonner"
import { AlertCircle, CheckCircle, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { AdminApplicationDTO, TimeSlotDTO } from "@/lib/admin-data"
import type { SeasonConfigDTO } from "@/lib/season-config"
import { apiJson, formatTime } from "@/lib/admin-client"
import { formatDateFr } from "@/lib/season"

export function ScheduleTab({
  applications,
  timeSlots,
  season,
  onRefresh,
  onSeasonChange,
}: {
  applications: AdminApplicationDTO[]
  timeSlots: TimeSlotDTO[]
  season: SeasonConfigDTO
  onRefresh: () => Promise<void>
  onSeasonChange: (season: SeasonConfigDTO) => void | Promise<void>
}) {
  const [busySlotId, setBusySlotId] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  const timeSlotsByDate = timeSlots.reduce<Record<string, TimeSlotDTO[]>>((acc, slot) => {
    ;(acc[slot.date] ??= []).push(slot)
    return acc
  }, {})

  const assignable = applications.filter((app) => !app.time_slot_id && app.status !== "rejected")

  const assign = async (applicationId: string, timeSlotId: string) => {
    setBusySlotId(timeSlotId)
    try {
      const result = await apiJson<{ emailSent?: boolean }>("/api/admin/time-slots/assign", {
        method: "POST",
        body: JSON.stringify({ applicationId, timeSlotId }),
      })
      await onRefresh()
      toast.success("Créneau attribué", {
        description: season.is_validated
          ? result.emailSent
            ? "Le candidat a reçu sa convocation par email."
            : "L'email de convocation n'a pas pu être envoyé."
          : "Le candidat sera prévenu à la validation du planning.",
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'attribution du créneau")
    } finally {
      setBusySlotId(null)
    }
  }

  const remove = async (applicationId: string, timeSlotId: string) => {
    setBusySlotId(timeSlotId)
    try {
      await apiJson("/api/admin/time-slots/remove", { method: "POST", body: JSON.stringify({ applicationId }) })
      await onRefresh()
      toast.success("Créneau libéré")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors du retrait du créneau")
    } finally {
      setBusySlotId(null)
    }
  }

  const validate = async () => {
    setIsValidating(true)
    try {
      const result = await apiJson<{ config: SeasonConfigDTO; emails: { sent: number; failed: string[] } }>(
        "/api/admin/season/validate",
        { method: "POST" },
      )
      onSeasonChange(result.config)
      toast.success("Planning validé", {
        description: `${result.emails.sent} convocation(s) envoyée(s)${result.emails.failed.length > 0 ? `, ${result.emails.failed.length} échec(s) : ${result.emails.failed.join(", ")}` : ""}.`,
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la validation du planning")
    } finally {
      setIsValidating(false)
    }
  }

  const reset = async () => {
    setIsValidating(true)
    try {
      const result = await apiJson<{ config: SeasonConfigDTO }>("/api/admin/season/reset", { method: "POST" })
      onSeasonChange(result.config)
      toast.success("Planning repassé en brouillon")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la réinitialisation du planning")
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle>Gestion des créneaux d&#39;audition</CardTitle>
            <CardDescription>Attribuez les créneaux en mode brouillon, puis validez le planning complet</CardDescription>
          </div>
          {season.is_validated ? (
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
        {!season.is_validated && (
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-blue-900 font-medium">Mode brouillon</p>
              <p className="text-sm text-blue-700 mt-1">
                Les créneaux attribués ne sont pas encore visibles par les candidats. Validez le planning complet pour
                les rendre publics et envoyer les convocations par email.
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {!season.is_validated ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={isValidating} className="bg-primary hover:bg-primary/90">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Valider le planning complet
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Valider le planning ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Les créneaux deviennent visibles dans l&#39;espace de chaque candidat et une convocation par email est
                    envoyée aux {applications.filter((a) => a.time_slot_id && a.status !== "rejected").length} candidat(s)
                    ayant un créneau.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={validate}>Valider et envoyer</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button onClick={reset} disabled={isValidating} variant="outline">
              Repasser en mode brouillon
            </Button>
          )}
        </div>

        {timeSlots.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Aucun créneau pour l&#39;édition {season.edition}. Générez-les depuis l&#39;onglet Paramètres.
          </p>
        )}

        <div className="space-y-6 pt-4">
          {Object.entries(timeSlotsByDate).map(([date, slots]) => (
            <div key={date} className="space-y-3">
              <h3 className="text-lg font-semibold">{formatDateFr(date)}</h3>
              <div className="grid gap-2">
                {slots.map((slot) => {
                  const assignedApp = applications.find((app) => app.time_slot_id === slot.id)
                  const busy = busySlotId === slot.id
                  return (
                    <Card key={slot.id} className={assignedApp ? "border-accent" : ""}>
                      <CardContent className="pt-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-4">
                            <div className="text-lg font-semibold text-accent">
                              {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                            </div>
                            {assignedApp ? (
                              <div>
                                <p className="font-medium">{assignedApp.stage_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {assignedApp.profile?.first_name || "N/A"} {assignedApp.profile?.last_name || ""}
                                </p>
                              </div>
                            ) : (
                              <Badge variant="outline">Disponible</Badge>
                            )}
                          </div>
                          {assignedApp ? (
                            <Button variant="outline" size="sm" onClick={() => remove(assignedApp.id, slot.id)} disabled={busy}>
                              {busy ? "..." : "Retirer"}
                            </Button>
                          ) : (
                            <Select value="" onValueChange={(appId) => assign(appId, slot.id)} disabled={busy || assignable.length === 0}>
                              <SelectTrigger className="w-full sm:w-64" aria-label={`Attribuer le créneau de ${formatTime(slot.start_time)}`}>
                                <SelectValue placeholder={busy ? "Attribution..." : "Attribuer à..."} />
                              </SelectTrigger>
                              <SelectContent>
                                {assignable.map((app) => (
                                  <SelectItem key={app.id} value={app.id}>
                                    {app.stage_name} ({app.profile?.first_name || "N/A"} {app.profile?.last_name || ""})
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
  )
}
