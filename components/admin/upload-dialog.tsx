"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MAX_PDF_BYTES, MAX_PDF_LABEL } from "@/lib/pdf"
import { apiJson } from "@/lib/admin-client"

export interface UploadTarget {
  type: "technical" | "parental"
  applicationId: string
  stageName: string
  memberIndex?: number
  memberName?: string
}

export function UploadDialog({
  target,
  onClose,
  onUploaded,
}: {
  target: UploadTarget | null
  onClose: () => void
  onUploaded: () => Promise<void>
}) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (file: File) => {
    if (!target) return
    setError(null)
    if (file.size > MAX_PDF_BYTES) {
      setError(`Le fichier ne doit pas dépasser ${MAX_PDF_LABEL}`)
      return
    }
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("applicationId", target.applicationId)
      let endpoint = "/api/admin/technical-sheet/upload"
      if (target.type === "parental") {
        formData.append("memberIndex", String(target.memberIndex ?? 0))
        endpoint = "/api/admin/parental-authorization/upload"
      }
      await apiJson(endpoint, { method: "POST", body: formData })
      await onUploaded()
      toast.success("Document enregistré")
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi du fichier")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {target?.type === "technical" ? "Ajouter/Remplacer la fiche technique" : "Ajouter/Remplacer l'autorisation parentale"}
          </DialogTitle>
          <DialogDescription>
            {target?.type === "technical"
              ? `Fiche technique de ${target.stageName} (PDF, ${MAX_PDF_LABEL} maximum)`
              : `Autorisation parentale pour ${target?.memberName ?? ""} (PDF, ${MAX_PDF_LABEL} maximum)`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label htmlFor="admin-upload-file" className="sr-only">
              Fichier PDF
            </label>
            <input
              id="admin-upload-file"
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void handleFile(file)
              }}
              disabled={isUploading}
              className="w-full"
            />
          </div>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded" role="alert">
              {error}
            </div>
          )}
          {isUploading && <div className="text-sm text-muted-foreground">Envoi en cours...</div>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
