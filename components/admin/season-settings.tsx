"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { CalendarPlus, Save, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import type { TimeSlotDTO } from "@/lib/admin-data"
import type { SeasonConfigDTO } from "@/lib/season-config"
import { apiJson } from "@/lib/admin-client"
import { formatDateFr, getAgeReferenceDate, getRegistrationStatus } from "@/lib/season"

/** Convertit un instant ISO en valeur pour <input type="datetime-local"> (heure locale du navigateur). */
function toLocalInput(iso: string | null): string {
  if (!iso) return ""
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function fromLocalInput(value: string): string | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export function SeasonSettings({
  season,
  timeSlots,
  onSeasonChange,
  onSlotsChange,
}: {
  season: SeasonConfigDTO
  timeSlots: TimeSlotDTO[]
  onSeasonChange: (season: SeasonConfigDTO) => void
  onSlotsChange: () => Promise<void>
}) {
  const [opensAt, setOpensAt] = useState(toLocalInput(season.registration_opens_at))
  const [closesAt, setClosesAt] = useState(toLocalInput(season.registration_closes_at))
  const [auditionDates, setAuditionDates] = useState<string[]>(season.audition_dates)
  const [newDate, setNewDate] = useState("")
  const [ageReferenceDate, setAgeReferenceDate] = useState(season.age_reference_date ?? "")
  const [venue, setVenue] = useState(season.venue ?? "")
  const [isSaving, setIsSaving] = useState(false)

  const [slotDate, setSlotDate] = useState("")
  const [slotStart, setSlotStart] = useState("10:00")
  const [slotEnd, setSlotEnd] = useState("18:30")
  const [slotDuration, setSlotDuration] = useState("10")
  const [isGenerating, setIsGenerating] = useState(false)

  const [newEdition, setNewEdition] = useState(String(season.edition + 1))
  const [isStartingSeason, setIsStartingSeason] = useState(false)

  useEffect(() => {
    setOpensAt(toLocalInput(season.registration_opens_at))
    setClosesAt(toLocalInput(season.registration_closes_at))
    setAuditionDates(season.audition_dates)
    setAgeReferenceDate(season.age_reference_date ?? "")
    setVenue(season.venue ?? "")
    setNewEdition(String(season.edition + 1))
  }, [season])

  const registrationStatus = getRegistrationStatus(season)
  const effectiveAgeReference = getAgeReferenceDate(season)
  const slotsByDate = timeSlots.reduce<Record<string, { total: number; assigned: number }>>((acc, slot) => {
    const entry = (acc[slot.date] ??= { total: 0, assigned: 0 })
    entry.total++
    if (!slot.is_available) entry.assigned++
    return acc
  }, {})

  const save = async () => {
    setIsSaving(true)
    try {
      const result = await apiJson<{ config: SeasonConfigDTO }>("/api/admin/season", {
        method: "PUT",
        body: JSON.stringify({
          edition: season.edition,
          registration_opens_at: fromLocalInput(opensAt),
          registration_closes_at: fromLocalInput(closesAt),
          audition_dates: auditionDates,
          age_reference_date: ageReferenceDate || null,
          venue: venue || null,
        }),
      })
      onSeasonChange(result.config)
      toast.success("Paramètres de la saison enregistrés")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'enregistrement")
    } finally {
      setIsSaving(false)
    }
  }

  const addDate = () => {
    if (!newDate || auditionDates.includes(newDate)) return
    setAuditionDates([...auditionDates, newDate].sort())
    setNewDate("")
  }

  const generateSlots = async () => {
    setIsGenerating(true)
    try {
      const result = await apiJson<{ created: number; skipped: number }>("/api/admin/time-slots", {
        method: "POST",
        body: JSON.stringify({ date: slotDate, startTime: slotStart, endTime: slotEnd, durationMinutes: Number(slotDuration) }),
      })
      await onSlotsChange()
      const refreshed = await apiJson<SeasonConfigDTO>("/api/admin/season")
      onSeasonChange(refreshed)
      toast.success(`${result.created} créneau(x) créé(s)`, {
        description: result.skipped > 0 ? `${result.skipped} créneau(x) existaient déjà.` : undefined,
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la génération des créneaux")
    } finally {
      setIsGenerating(false)
    }
  }

  const deleteSlots = async (date: string) => {
    try {
      const result = await apiJson<{ deleted: number; remaining: number }>(`/api/admin/time-slots?date=${date}`, { method: "DELETE" })
      await onSlotsChange()
      toast.success(`${result.deleted} créneau(x) supprimé(s)`, {
        description: result.remaining > 0 ? `${result.remaining} créneau(x) attribué(s) conservé(s).` : undefined,
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la suppression des créneaux")
    }
  }

  const startNewSeason = async () => {
    setIsStartingSeason(true)
    try {
      const result = await apiJson<{ config: SeasonConfigDTO }>("/api/admin/season/new", {
        method: "POST",
        body: JSON.stringify({ edition: Number(newEdition) }),
      })
      onSeasonChange(result.config)
      await onSlotsChange()
      toast.success(`Saison ${result.config.edition} ouverte`, {
        description: "Configurez les dates d'inscription et d'audition, puis générez les créneaux.",
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'ouverture de la saison")
    } finally {
      setIsStartingSeason(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Saison en cours : édition {season.edition}</CardTitle>
          <CardDescription>
            Inscriptions :{" "}
            <span className="font-medium">
              {registrationStatus === "open" ? "ouvertes" : registrationStatus === "closed" ? "closes" : "pas encore ouvertes"}
            </span>
            {" · "}Âge calculé au {formatDateFr(effectiveAgeReference, { weekday: false })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="season-opens">Ouverture des inscriptions</Label>
              <Input id="season-opens" type="datetime-local" value={opensAt} onChange={(e) => setOpensAt(e.target.value)} />
              <p className="text-xs text-muted-foreground">Vide = ouvertes immédiatement (jusqu&#39;à la clôture).</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="season-closes">Clôture des inscriptions</Label>
              <Input id="season-closes" type="datetime-local" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} />
              <p className="text-xs text-muted-foreground">Vide = pas de date de clôture.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Dates d&#39;audition</Label>
            <div className="flex flex-wrap gap-2">
              {auditionDates.length === 0 && <p className="text-sm text-muted-foreground">Aucune date définie.</p>}
              {auditionDates.map((date) => (
                <span key={date} className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
                  {formatDateFr(date)}
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={`Retirer la date ${date}`}
                    onClick={() => setAuditionDates(auditionDates.filter((d) => d !== date))}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 max-w-sm">
              <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} aria-label="Nouvelle date d'audition" />
              <Button type="button" variant="outline" onClick={addDate} disabled={!newDate}>
                Ajouter
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="season-age-ref">Date de référence pour l&#39;âge</Label>
              <Input id="season-age-ref" type="date" value={ageReferenceDate} onChange={(e) => setAgeReferenceDate(e.target.value)} />
              <p className="text-xs text-muted-foreground">Vide = dernière date d&#39;audition (sinon 31 janvier {season.edition}).</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="season-venue">Lieu des auditions</Label>
              <Input id="season-venue" value={venue} onChange={(e) => setVenue(e.target.value)} maxLength={200} />
            </div>
          </div>

          <Button onClick={save} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Enregistrement..." : "Enregistrer la saison"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Créneaux d&#39;audition</CardTitle>
          <CardDescription>Générez les créneaux d&#39;une journée. La date est ajoutée automatiquement aux dates d&#39;audition.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="slot-date">Date</Label>
              <Input id="slot-date" type="date" value={slotDate} onChange={(e) => setSlotDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slot-start">Début</Label>
              <Input id="slot-start" type="time" value={slotStart} onChange={(e) => setSlotStart(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slot-end">Fin</Label>
              <Input id="slot-end" type="time" value={slotEnd} onChange={(e) => setSlotEnd(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slot-duration">Durée (min)</Label>
              <Input id="slot-duration" type="number" min={5} max={240} value={slotDuration} onChange={(e) => setSlotDuration(e.target.value)} />
            </div>
          </div>
          <Button onClick={generateSlots} disabled={isGenerating || !slotDate} variant="outline">
            <CalendarPlus className="h-4 w-4 mr-2" />
            {isGenerating ? "Génération..." : "Générer les créneaux"}
          </Button>

          {Object.keys(slotsByDate).length > 0 && (
            <div className="space-y-2 pt-2">
              {Object.entries(slotsByDate)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([date, info]) => (
                  <div key={date} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                    <span>
                      <span className="font-medium">{formatDateFr(date)}</span> · {info.total} créneau(x), {info.assigned} attribué(s)
                    </span>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive" aria-label={`Supprimer les créneaux libres du ${date}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer les créneaux libres du {formatDateFr(date)} ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Seuls les créneaux non attribués sont supprimés. Les créneaux déjà attribués sont conservés.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteSlots(date)}>Supprimer</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-accent/40">
        <CardHeader>
          <CardTitle>Ouvrir une nouvelle saison</CardTitle>
          <CardDescription>
            Les candidatures et créneaux de l&#39;édition {season.edition} sont conservés en archive (section « Archives par
            édition » ci-dessous) et disparaissent de la vue courante. Les candidats pourront candidater à nouveau avec
            leur compte existant.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label htmlFor="new-edition">Nouvelle édition (année de la finale)</Label>
            <Input id="new-edition" type="number" min={season.edition + 1} value={newEdition} onChange={(e) => setNewEdition(e.target.value)} className="w-32" />
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="default" disabled={isStartingSeason}>
                Ouvrir la saison {newEdition}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Ouvrir la saison {newEdition} ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Pensez à exporter les candidatures de l&#39;édition {season.edition} avant (Excel et fiches techniques).
                  Les dates d&#39;inscription et d&#39;audition seront remises à zéro ; le planning repasse en brouillon.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={startNewSeason}>Ouvrir la saison</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}
