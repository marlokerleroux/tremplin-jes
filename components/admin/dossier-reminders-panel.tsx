"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { FileWarning, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { AdminApplicationDTO } from "@/lib/admin-data"
import type { SeasonConfigDTO } from "@/lib/season-config"
import { apiJson, getMissingDocuments } from "@/lib/admin-client"
import { formatDateTimeFr } from "@/lib/season"
import { DOSSIER_REMINDER_LIMITS } from "@/lib/dossier-reminders"

/** Réglages et suivi des relances automatiques des dossiers incomplets (Paramètres). */
export function DossierRemindersPanel({
  applications,
  season,
  ageReferenceDate,
  onSeasonChange,
}: {
  applications: AdminApplicationDTO[]
  season: SeasonConfigDTO
  ageReferenceDate: string
  onSeasonChange: (season: SeasonConfigDTO) => void | Promise<void>
}) {
  const [enabled, setEnabled] = useState(season.dossier_reminders_enabled)
  const [intervalDays, setIntervalDays] = useState(String(season.dossier_reminder_interval_days))
  const [finalDays, setFinalDays] = useState(String(season.dossier_reminder_final_days))
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setEnabled(season.dossier_reminders_enabled)
    setIntervalDays(String(season.dossier_reminder_interval_days))
    setFinalDays(String(season.dossier_reminder_final_days))
  }, [season.dossier_reminders_enabled, season.dossier_reminder_interval_days, season.dossier_reminder_final_days])

  const incomplete = applications.filter((a) => a.status === "pending" && getMissingDocuments(a, ageReferenceDate).length > 0)
  const reminded = incomplete.filter((a) => a.dossier_reminder_count > 0).length
  const closesAt = season.registration_closes_at
  const closed = closesAt ? new Date(closesAt) <= new Date() : false

  const save = async () => {
    setIsSaving(true)
    try {
      const { config } = await apiJson<{ config: SeasonConfigDTO }>("/api/admin/reminders/dossier-settings", {
        method: "PUT",
        body: JSON.stringify({ enabled, intervalDays: Number(intervalDays), finalDays: Number(finalDays) }),
      })
      await onSeasonChange(config)
      toast.success("Réglages des relances enregistrés")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'enregistrement")
    } finally {
      setIsSaving(false)
    }
  }

  let status: string
  if (!season.dossier_reminders_enabled) status = "désactivées"
  else if (!closesAt) status = "inactives (aucune date de clôture des inscriptions)"
  else if (closed) status = "terminées (inscriptions closes)"
  else status = `actives jusqu'au ${formatDateTimeFr(closesAt)}`

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileWarning className="h-5 w-5" />
          Relances des dossiers incomplets
        </CardTitle>
        <CardDescription>
          Chaque matin, les candidats dont la candidature est en attente mais à qui il manque la fiche technique ou une
          autorisation parentale (membres mineurs) reçoivent un email listant les pièces manquantes et rappelant que seuls
          les dossiers complets seront pris en compte. Première relance après la fréquence choisie, puis à ce rythme, avec
          un dernier rappel renforcé à l&#39;approche de la clôture. Les relances s&#39;arrêtent à la clôture des
          inscriptions. Les textes se modifient dans « Modèles d&#39;emails ».
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">
          Relances : <span className="font-medium">{status}</span>
          {" · "}
          {incomplete.length} dossier(s) incomplet(s) en attente · {reminded} déjà relancé(s)
        </p>
        <div className="flex items-center gap-2">
          <Checkbox id="dossier-reminders-enabled" checked={enabled} onCheckedChange={(v) => setEnabled(v === true)} />
          <Label htmlFor="dossier-reminders-enabled">Activer les relances automatiques</Label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="dossier-reminders-interval">Fréquence (jours entre deux relances)</Label>
            <Input
              id="dossier-reminders-interval"
              type="number"
              min={DOSSIER_REMINDER_LIMITS.intervalDays.min}
              max={DOSSIER_REMINDER_LIMITS.intervalDays.max}
              value={intervalDays}
              onChange={(e) => setIntervalDays(e.target.value)}
              disabled={!enabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dossier-reminders-final">Dernier rappel (jours avant la clôture, 0 = aucun)</Label>
            <Input
              id="dossier-reminders-final"
              type="number"
              min={DOSSIER_REMINDER_LIMITS.finalDays.min}
              max={DOSSIER_REMINDER_LIMITS.finalDays.max}
              value={finalDays}
              onChange={(e) => setFinalDays(e.target.value)}
              disabled={!enabled}
            />
          </div>
        </div>
        <Button onClick={save} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </CardContent>
    </Card>
  )
}
