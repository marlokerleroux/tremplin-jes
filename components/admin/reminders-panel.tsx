"use client"

import { useState } from "react"
import { toast } from "sonner"
import { BellRing } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { AdminApplicationDTO } from "@/lib/admin-data"
import type { SeasonConfigDTO } from "@/lib/season-config"
import { apiJson } from "@/lib/admin-client"

interface RunResult {
  today: string
  scheduleValidated: boolean
  candidates: number
  sent: { j7: number; j1: number }
  failed: string[]
}

export function RemindersPanel({
  applications,
  season,
  smtpConfigured,
  onRefresh,
}: {
  applications: AdminApplicationDTO[]
  season: SeasonConfigDTO
  smtpConfigured: boolean
  onRefresh: () => Promise<void>
}) {
  const [isRunning, setIsRunning] = useState(false)
  const scheduled = applications.filter((a) => a.time_slot_id && a.status !== "rejected")
  const j7 = scheduled.filter((a) => a.reminder_j7_sent_at).length
  const j1 = scheduled.filter((a) => a.reminder_j1_sent_at).length

  const run = async () => {
    setIsRunning(true)
    try {
      const { result } = await apiJson<{ result: RunResult }>("/api/admin/reminders/run", { method: "POST" })
      await onRefresh()
      const total = result.sent.j7 + result.sent.j1
      if (!result.scheduleValidated) {
        toast.info("Planning non validé : aucun rappel envoyé")
      } else if (total === 0 && result.failed.length === 0) {
        toast.info("Aucun rappel à envoyer aujourd'hui", { description: `${result.candidates} candidat(s) convoqué(s) examiné(s).` })
      } else {
        toast.success(`${total} rappel(s) envoyé(s)`, {
          description: `J-7 : ${result.sent.j7}, J-1 : ${result.sent.j1}${result.failed.length > 0 ? ` · échecs : ${result.failed.join(", ")}` : ""}`,
        })
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'envoi des rappels")
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellRing className="h-5 w-5" />
          Rappels automatiques avant audition
        </CardTitle>
        <CardDescription>
          Chaque matin, un rappel est envoyé une semaine avant (J-7) et la veille (J-1) de l&#39;audition aux candidats
          convoqués, une fois le planning validé. Cette tâche quotidienne maintient aussi la base de données active.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm">
          Planning : <span className="font-medium">{season.is_validated ? "validé" : "brouillon (rappels inactifs)"}</span>
          {" · "}
          {scheduled.length} candidat(s) convoqué(s) · J-7 envoyé à {j7} · J-1 envoyé à {j1}
        </p>
        <Button onClick={run} variant="outline" disabled={isRunning || !smtpConfigured}>
          {isRunning ? "Vérification..." : "Envoyer maintenant les rappels dus"}
        </Button>
      </CardContent>
    </Card>
  )
}
