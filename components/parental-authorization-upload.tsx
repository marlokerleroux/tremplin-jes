"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, Download, CheckCircle2, AlertCircle, Lock } from "lucide-react"
import { MAX_PDF_BYTES, MAX_PDF_LABEL } from "@/lib/pdf"

interface ParentalAuthorizationUploadProps {
  applicationId: string
  memberIndex: number
  /** URL authentifiée du PDF existant, ou null. */
  existingUrl: string | null
  isLocked: boolean
}

export function ParentalAuthorizationUpload({
  applicationId,
  memberIndex,
  existingUrl,
  isLocked,
}: ParentalAuthorizationUploadProps) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        setError("Seuls les fichiers PDF sont acceptés")
        setFile(null)
        return
      }
      if (selectedFile.size > MAX_PDF_BYTES) {
        setError(`Le fichier ne doit pas dépasser ${MAX_PDF_LABEL}`)
        setFile(null)
        return
      }
      setFile(selectedFile)
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!file || isLocked) return

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("applicationId", applicationId)
      formData.append("memberIndex", memberIndex.toString())

      const response = await fetch("/api/parental-authorization/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Erreur lors de l'envoi du fichier")
      }

      setSuccess(true)
      setTimeout(() => {
        window.location.assign("/dashboard")
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi du fichier")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      {isLocked && (
        <Alert className="border-[#246BDC] bg-blue-50">
          <Lock className="h-4 w-4 text-[#246BDC]" />
          <AlertDescription className="text-[#246BDC] font-medium">
            Votre candidature a été validée. Il n&#39;est plus possible de modifier votre autorisation parentale.
          </AlertDescription>
        </Alert>
      )}

      {/* Download Template Section */}
      <Card className="border-[#246BDC]/20">
        <CardHeader>
          <CardTitle className="text-[#246BDC] flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Modèle d&#39;autorisation parentale
          </CardTitle>
          <CardDescription>Téléchargez le modèle à remplir et faire signer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <a
            href="/pdf/autorisation-parentale.pdf"
            download
            className="flex items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-[#246BDC] hover:bg-blue-50 transition-colors"
          >
            <Download className="h-5 w-5 text-[#246BDC]" />
            <div>
              <div className="text-sm font-medium">Télécharger le modèle PDF</div>
              <div className="text-xs text-gray-500">À remplir et faire signer par les parents/tuteurs légaux</div>
            </div>
          </a>
          <p className="text-sm text-gray-600">
            Téléchargez ce document, remplissez-le avec les informations du candidat, faites-le signer par les
            parents/tuteurs légaux, puis envoyez-le ci-dessous.
          </p>
        </CardContent>
      </Card>

      {/* Current Status */}
      {!isLocked && existingUrl && (
        <Alert className="border-yellow-500 bg-yellow-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <span className="text-yellow-700">
              Votre autorisation parentale a bien été reçue. Vous pouvez la remplacer si nécessaire tant que votre
              candidature n&#39;est pas validée.
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Upload Section */}
      <Card className="border-[#246BDC]/20">
        <CardHeader>
          <CardTitle className="text-[#246BDC]">
            {existingUrl ? "Remplacer l'autorisation parentale" : "Envoyer l'autorisation parentale"}
          </CardTitle>
          <CardDescription>
            {isLocked ? "Modification verrouillée - candidature validée" : `Format PDF uniquement, taille maximale ${MAX_PDF_LABEL}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {existingUrl && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Autorisation parentale actuelle :</p>
              <a
                href={existingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#246BDC] hover:underline flex items-center gap-2"
              >
                <FileText className="h-4 w-4 text-[#246BDC]" />
                Voir le fichier
              </a>
            </div>
          )}

          {!isLocked && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label htmlFor="parental-authorization-file" className="sr-only">
                  Fichier PDF de l&#39;autorisation parentale signée
                </label>
                <input
                  id="parental-authorization-file"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="flex-1 min-w-0 w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#246BDC] file:text-white hover:file:bg-[#1d5ab8] file:cursor-pointer"
                />
              </div>

              {file && (
                <div className="p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                  <div className="flex items-start gap-2 min-w-0">
                    <FileText className="h-4 w-4 text-[#246BDC] shrink-0 mt-0.5" />
                    <span className="text-sm font-medium break-all">{file.name}</span>
                    <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} Mo)</span>
                  </div>
                </div>
              )}

              {error && (
                <Alert variant="destructive" role="alert">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-500 bg-green-50" role="status">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    Autorisation parentale envoyée avec succès ! Redirection...
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className="bg-[#246BDC] hover:bg-[#1d5ab8] text-white"
                >
                  {uploading ? (
                    <>
                      <Upload className="mr-2 h-4 w-4 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Envoyer
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => router.push("/dashboard")}>
                  Retour au tableau de bord
                </Button>
              </div>
            </div>
          )}

          {isLocked && (
            <Button variant="outline" onClick={() => router.push("/dashboard")} className="w-full">
              Retour au tableau de bord
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
