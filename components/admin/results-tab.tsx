"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Award, Mail, Search, Send } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
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
import type { AdminApplicationDTO } from "@/lib/admin-data"
import type { SeasonConfigDTO } from "@/lib/season-config"
import { apiJson, formatTime } from "@/lib/admin-client"
import { formatDateFr, formatDateTimeFr } from "@/lib/season"

export const FINALISTS_TARGET = 6

interface SendReport {
  selected: number
  notSelected: number
  skipped: number
  failed: string[]
}

export function ResultsTab({
  applications,
  season,
  smtpConfigured,
  onFinalistChange,
  onRefresh,
}: {
  applications: AdminApplicationDTO[]
  season: SeasonConfigDTO
  smtpConfigured: boolean
  onFinalistChange: (applicationId: string, isFinalist: boolean) => void
  onRefresh: () => Promise<void>
}) {
  const [searchTerm, setSearchTerm] = useState("")
  const [busyId, setBusyId] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [resend, setResend] = useState(false)

  const audience = applications
    .filter((app) => app.status === "validated")
    .sort((a, b) => a.stage_name.localeCompare(b.stage_name, "fr"))
  const finalists = audience.filter((app) => app.is_finalist)
  const alreadySent = audience.filter((app) => app.result_sent_at).length
  const toSend = resend ? audience.length : audience.length - alreadySent

  const filtered = audience.filter((app) => {
    const term = searchTerm.toLowerCase()
    return (
      app.stage_name.toLowerCase().includes(term) ||
      app.profile?.first_name?.toLowerCase().includes(term) ||
      app.profile?.last_name?.toLowerCase().includes(term)
    )
  })

  const toggleFinalist = async (app: AdminApplicationDTO, isFinalist: boolean) => {
    setBusyId(app.id)
    try {
      await apiJson("/api/admin/results", { method: "PUT", body: JSON.stringify({ applicationId: app.id, isFinalist }) })
      onFinalistChange(app.id, isFinalist)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la mise à jour")
    } finally {
      setBusyId(null)
    }
  }

  const send = async () => {
    setIsSending(true)
    try {
      const { report } = await apiJson<{ report: SendReport }>("/api/admin/results/send", {
        method: "POST",
        body: JSON.stringify({ resend }),
      })
      await onRefresh()
      const summary = `${report.selected} finaliste(s) et ${report.notSelected} non retenu(s) informés${report.skipped > 0 ? `, ${report.skipped} déjà informé(s) ignoré(s)` : ""}.`
      if (report.failed.length > 0) {
        toast.warning("Résultats envoyés avec des échecs", { description: `${summary} Échecs : ${report.failed.join(", ")}.`, duration: 15000 })
      } else {
        toast.success("Résultats envoyés", { description: summary, duration: 10000 })
      }
      setResend(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'envoi des résultats")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Candidatures auditionnées (validées)</CardDescription>
            <CardTitle className="text-3xl">{audience.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-1">
              <Award className="h-4 w-4 text-accent" />
              Finalistes sélectionnés
            </CardDescription>
            <CardTitle className={`text-3xl ${finalists.length === FINALISTS_TARGET ? "text-green-700" : "text-accent"}`}>
              {finalists.length} <span className="text-base font-normal text-muted-foreground">/ {FINALISTS_TARGET}</span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-1">
              <Mail className="h-4 w-4 text-primary" />
              Résultats envoyés
            </CardDescription>
            <CardTitle className="text-3xl text-primary">
              {alreadySent} <span className="text-base font-normal text-muted-foreground">/ {audience.length}</span>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Annonce des résultats · édition {season.edition}</CardTitle>
          <CardDescription>
            Cochez les finalistes après les délibérations, puis envoyez les résultats juste après le live : les finalistes
            reçoivent le modèle « Résultats : finaliste », les autres candidats auditionnés le modèle « Résultats : non
            retenu » (textes modifiables dans Paramètres › Emails).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!smtpConfigured && (
            <p className="text-sm text-yellow-900 bg-yellow-50 border border-yellow-300 rounded-lg p-3">
              Configurez l&#39;envoi SMTP dans l&#39;onglet Paramètres avant d&#39;envoyer les résultats.
            </p>
          )}
          {finalists.length !== FINALISTS_TARGET && audience.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {finalists.length} finaliste(s) coché(s) pour {FINALISTS_TARGET} attendus. Vous pouvez tout de même envoyer.
            </p>
          )}
          <div className="flex items-center space-x-2">
            <Checkbox id="results-resend" checked={resend} onCheckedChange={(c) => setResend(c === true)} />
            <Label htmlFor="results-resend" className="font-normal">
              Renvoyer aussi aux candidats déjà informés ({alreadySent})
            </Label>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={isSending || !smtpConfigured || toSend === 0}>
                <Send className="h-4 w-4 mr-2" />
                {isSending ? "Envoi en cours..." : `Envoyer les résultats (${toSend})`}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Envoyer les résultats à {toSend} candidat(s) ?</AlertDialogTitle>
                <AlertDialogDescription>
                  {finalists.length} email(s) « finaliste » et {toSend - (resend ? finalists.length : finalists.filter((f) => !f.result_sent_at).length)} email(s) « non retenu »
                  seront envoyés immédiatement. Vérifiez la liste des finalistes avant de confirmer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={send}>Envoyer</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="relative">
            <Label htmlFor="results-search" className="sr-only">
              Rechercher
            </Label>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="results-search"
              placeholder="Rechercher un candidat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {audience.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Aucune candidature validée pour l&#39;édition {season.edition}. Les résultats concernent les candidats dont le dossier a été validé.
            </p>
          ) : (
            <div className="divide-y">
              {filtered.map((app) => (
                <div key={app.id} className="flex flex-wrap items-center gap-3 py-3">
                  <Checkbox
                    id={`finalist-${app.id}`}
                    checked={app.is_finalist}
                    disabled={busyId === app.id}
                    onCheckedChange={(checked) => toggleFinalist(app, checked === true)}
                    aria-label={`Finaliste : ${app.stage_name}`}
                  />
                  <label htmlFor={`finalist-${app.id}`} className="flex-1 min-w-[200px] cursor-pointer">
                    <span className="font-medium">{app.stage_name}</span>
                    <span className="block text-sm text-muted-foreground">
                      {app.profile?.first_name} {app.profile?.last_name} · {app.musical_style}
                      {app.time_slot && ` · ${formatDateFr(app.time_slot.date, { weekday: false })} ${formatTime(app.time_slot.start_time)}`}
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    {app.is_finalist && (
                      <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">
                        <Award className="h-3 w-3 mr-1" />
                        Finaliste
                      </Badge>
                    )}
                    {app.result_sent_at ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Envoyé le {formatDateTimeFr(app.result_sent_at)}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Non informé
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              {filtered.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Aucun candidat trouvé</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
