"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Archive, FileSpreadsheet, FolderArchive, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { EditionSummary } from "@/lib/admin-data"
import { apiJson } from "@/lib/admin-client"

interface EditionsResponse {
  current: number
  editions: EditionSummary[]
  orphanAccounts: number
}

export function EditionsPanel({ currentEdition }: { currentEdition: number }) {
  const [data, setData] = useState<EditionsResponse | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [purgeTarget, setPurgeTarget] = useState<EditionSummary | null>(null)
  const [confirmation, setConfirmation] = useState("")
  const [purgeAccounts, setPurgeAccounts] = useState(false)

  const load = useCallback(async () => {
    try {
      setData(await apiJson<EditionsResponse>("/api/admin/editions"))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de charger les éditions")
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load, currentEdition])

  const exportExcel = async (edition: number) => {
    setBusy(`excel-${edition}`)
    try {
      const rows = await apiJson<Record<string, unknown>[]>(`/api/applications/export?edition=${edition}`)
      const XLSX = await import("xlsx")
      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, `Candidatures ${edition}`)
      XLSX.writeFile(wb, `candidatures_${edition}.xlsx`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'export Excel")
    } finally {
      setBusy(null)
    }
  }

  const exportZip = async (edition: number) => {
    setBusy(`zip-${edition}`)
    try {
      const sheets = await apiJson<Array<{ stageName: string; url: string }>>(`/api/technical-sheets/download-all?edition=${edition}`)
      if (sheets.length === 0) {
        toast.info("Aucune fiche technique pour cette édition")
        return
      }
      const JSZip = (await import("jszip")).default
      const zip = new JSZip()
      for (const sheet of sheets) {
        const response = await fetch(sheet.url)
        if (!response.ok) continue
        zip.file(`${sheet.stageName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`, await response.blob())
      }
      const blob = await zip.generateAsync({ type: "blob" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `fiches_techniques_${edition}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la création du ZIP")
    } finally {
      setBusy(null)
    }
  }

  const purge = async () => {
    if (!purgeTarget) return
    setBusy(`purge-${purgeTarget.edition}`)
    try {
      const result = await apiJson<{ deleted: { applications: number; timeSlots: number; files: number; filesFailed: number; accounts: number } }>(
        `/api/admin/editions/${purgeTarget.edition}${purgeAccounts ? "?accounts=1" : ""}`,
        { method: "DELETE", body: JSON.stringify({ confirmation }) },
      )
      toast.success(`Édition ${purgeTarget.edition} purgée`, {
        description: `${result.deleted.applications} candidature(s), ${result.deleted.files} fichier(s), ${result.deleted.timeSlots} créneau(x)${purgeAccounts ? `, ${result.deleted.accounts} compte(s)` : ""} supprimé(s).`,
      })
      if (result.deleted.filesFailed > 0) {
        toast.warning(`${result.deleted.filesFailed} fichier(s) n'ont pas pu être supprimés du stockage`, {
          description: "Vérifiez le jeton BLOB_READ_WRITE_TOKEN_LEGACY pour les fichiers de l'ancien store.",
        })
      }
      setPurgeTarget(null)
      setConfirmation("")
      setPurgeAccounts(false)
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la purge")
    } finally {
      setBusy(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Archive className="h-5 w-5" />
          Archives par édition
        </CardTitle>
        <CardDescription>
          Exportez les données d&#39;une édition passée, puis purgez-la une fois la durée de conservation écoulée (2 ans
          selon la politique de confidentialité).
          {data && data.orphanAccounts > 0 && ` ${data.orphanAccounts} compte(s) candidat sans candidature.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!data && <p className="text-sm text-muted-foreground">Chargement...</p>}
        {data?.editions.map((edition) => (
          <div key={edition.edition} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold">Édition {edition.edition}</span>
              {edition.is_current && <Badge variant="outline">en cours</Badge>}
              <span className="text-sm text-muted-foreground">
                {edition.applications} candidature(s) · {edition.validated} validée(s) · {edition.time_slots} créneau(x)
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => exportExcel(edition.edition)} disabled={busy !== null || edition.applications === 0}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportZip(edition.edition)} disabled={busy !== null || edition.applications === 0}>
                <FolderArchive className="h-4 w-4 mr-2" />
                Fiches techniques
              </Button>
              {!edition.is_current && (
                <Button variant="outline" size="sm" className="text-destructive" onClick={() => setPurgeTarget(edition)} disabled={busy !== null}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Purger
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>

      <Dialog open={purgeTarget !== null} onOpenChange={(open) => !open && setPurgeTarget(null)}>
        <DialogContent className="[overflow-wrap:anywhere]">
          <DialogHeader>
            <DialogTitle>Purger définitivement l&#39;édition {purgeTarget?.edition} ?</DialogTitle>
            <DialogDescription>
              {purgeTarget?.applications} candidature(s), leurs fiches techniques, autorisations parentales, suivi
              d&#39;audition et {purgeTarget?.time_slots} créneau(x) seront supprimés. Cette action est irréversible :
              exportez d&#39;abord les données si nécessaire.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-start space-x-2">
              <Checkbox id="purge-accounts" checked={purgeAccounts} onCheckedChange={(c) => setPurgeAccounts(c === true)} />
              <Label htmlFor="purge-accounts" className="font-normal leading-relaxed">
                Supprimer aussi les comptes des candidats de cette édition qui n&#39;auront plus aucune candidature.
              </Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="purge-confirmation">
                Tapez <code className="font-mono">SUPPRIMER {purgeTarget?.edition}</code> pour confirmer
              </Label>
              <Input id="purge-confirmation" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} autoComplete="off" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPurgeTarget(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={purge}
              disabled={busy !== null || confirmation.trim() !== `SUPPRIMER ${purgeTarget?.edition}`}
            >
              Purger l&#39;édition
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
