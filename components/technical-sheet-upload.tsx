"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, Download, CheckCircle2, AlertCircle, Lock } from "lucide-react"

interface TechnicalSheetUploadProps {
  applicationId: string
  existingSheet: {
    pdf_url?: string
    validated?: boolean
  } | null
  applicationStatus: string // Add application status prop
}

export function TechnicalSheetUpload({ applicationId, existingSheet, applicationStatus }: TechnicalSheetUploadProps) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const isLocked = applicationStatus === "validated"

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        setError("Seuls les fichiers PDF sont acceptés")
        setFile(null)
        return
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("Le fichier ne doit pas dépasser 10 MB")
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

      const response = await fetch("/api/technical-sheet/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erreur lors de l'upload")
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/dashboard")
        router.refresh()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'upload")
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
            Votre candidature a été validée. Il n'est plus possible de modifier votre fiche technique.
          </AlertDescription>
        </Alert>
      )}

      {/* Examples Section */}
      <Card className="border-[#246BDC]/20">
        <CardHeader>
          <CardTitle className="text-[#246BDC] flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Exemples de fiches techniques
          </CardTitle>
          <CardDescription>Téléchargez ces exemples pour vous inspirer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <a
            href="/pdf/exemples-fiches-techniques.pdf"
            download
            className="flex items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-[#246BDC] hover:bg-blue-50 transition-colors"
          >
            <Download className="h-5 w-5 text-[#246BDC]" />
            <div>
              <div className="text-sm font-medium">Télécharger les exemples de fiches techniques</div>
              <div className="text-xs text-gray-500">Exemples solo et groupes (PDF)</div>
            </div>
          </a>
          <p className="text-sm text-gray-600">
            Ce document contient plusieurs exemples de fiches techniques (solo et groupes) pour vous aider à préparer la
            vôtre : nombre d'artistes, instruments, besoins en sonorisation, plan de scène, etc.
          </p>
        </CardContent>
      </Card>

      {/* Current Status */}
      {!isLocked && existingSheet?.pdf_url && (
        <Alert className={existingSheet.validated ? "border-green-500 bg-green-50" : "border-yellow-500 bg-yellow-50"}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {existingSheet.validated ? (
              <span className="text-green-700 font-medium">✓ Votre fiche technique a été validée par l'équipe</span>
            ) : (
              <span className="text-yellow-700">
                Votre fiche technique est en cours de validation. Vous pouvez la remplacer si nécessaire.
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Upload Section */}
      <Card className="border-[#246BDC]/20">
        <CardHeader>
          <CardTitle className="text-[#246BDC]">
            {existingSheet?.pdf_url ? "Remplacer votre fiche technique" : "Télécharger votre fiche technique"}
          </CardTitle>
          <CardDescription>
            {isLocked
              ? "Modification verrouillée - candidature validée"
              : "Format PDF uniquement, taille maximale 10 MB"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {existingSheet?.pdf_url && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Fiche technique actuelle :</p>
              <a
                href={existingSheet.pdf_url}
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
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="flex-1 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#246BDC] file:text-white hover:file:bg-[#1d5ab8] file:cursor-pointer"
                />
              </div>

              {file && (
                <div className="p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#246BDC]" />
                    <span className="text-sm font-medium">{file.name}</span>
                    <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-500 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    Fiche technique téléchargée avec succès ! Redirection...
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className="bg-[#246BDC] hover:bg-[#1d5ab8] text-white"
                >
                  {uploading ? (
                    <>
                      <Upload className="mr-2 h-4 w-4 animate-spin" />
                      Téléchargement...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Télécharger
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => router.push("/dashboard")}>
                  Retour au dashboard
                </Button>
              </div>
            </div>
          )}

          {isLocked && (
            <Button variant="outline" onClick={() => router.push("/dashboard")} className="w-full">
              Retour au dashboard
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
