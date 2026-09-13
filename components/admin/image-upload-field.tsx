"use client"

import { useState } from "react"
import { toast } from "sonner"
import { ImagePlus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiJson } from "@/lib/admin-client"
import { MAX_IMAGE_LABEL } from "@/lib/image"

/** Champ image du site vitrine : aperçu, envoi vers le stockage, suppression. */
export function ImageUploadField({
  value,
  onChange,
  label,
  square = false,
}: {
  value: string
  onChange: (url: string) => void
  label: string
  square?: boolean
}) {
  const [isUploading, setIsUploading] = useState(false)
  const inputId = `image-${label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${Math.random().toString(36).slice(2, 7)}`

  const upload = async (file: File) => {
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const result = await apiJson<{ url: string }>("/api/admin/vitrine/media", { method: "POST", body: formData })
      onChange(result.url)
      toast.success("Image envoyée", { description: "Pensez à enregistrer pour la publier." })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'envoi de l'image")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex items-start gap-3">
      <div className={`relative shrink-0 overflow-hidden rounded border bg-muted ${square ? "h-20 w-20" : "h-14 w-28"}`}>
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className={`h-full w-full ${square ? "object-cover" : "object-contain"}`} />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImagePlus className="h-5 w-5" />
          </div>
        )}
      </div>
      <div className="space-y-1 min-w-0">
        <label htmlFor={inputId} className="text-sm font-medium">
          {label}
        </label>
        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={isUploading}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void upload(file)
            e.target.value = ""
          }}
          className="block w-full max-w-xs text-xs file:mr-2 file:rounded file:border-0 file:bg-primary file:px-2 file:py-1 file:text-xs file:font-semibold file:text-white"
        />
        <p className="text-xs text-muted-foreground">
          JPEG, PNG ou WebP, {MAX_IMAGE_LABEL} maximum.{isUploading && " Envoi en cours…"}
        </p>
        {value && (
          <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onChange("")}>
            <X className="h-3 w-3 mr-1" />
            Retirer l&#39;image
          </Button>
        )}
      </div>
    </div>
  )
}
