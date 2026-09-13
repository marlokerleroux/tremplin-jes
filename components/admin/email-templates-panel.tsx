"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Eye, FileText, RotateCcw, Save, Send } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { apiJson } from "@/lib/admin-client"
import { formatDateTimeFr } from "@/lib/season"
import type { EditableTemplateKey, TemplateVariable } from "@/lib/email/editable-templates"

interface TemplateItem {
  key: EditableTemplateKey
  label: string
  description: string
  variables: TemplateVariable[]
  subject: string
  body: string
  defaultSubject: string
  defaultBody: string
  isCustomized: boolean
  updated_at: string | null
}

interface TemplatesResponse {
  variables: Record<TemplateVariable, string>
  templates: TemplateItem[]
}

export function EmailTemplatesPanel({ smtpConfigured }: { smtpConfigured: boolean }) {
  const [data, setData] = useState<TemplatesResponse | null>(null)
  const [selectedKey, setSelectedKey] = useState<EditableTemplateKey | null>(null)
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [busy, setBusy] = useState<string | null>(null)
  const [preview, setPreview] = useState<{ subject: string; html: string } | null>(null)

  const load = useCallback(async () => {
    try {
      const response = await apiJson<TemplatesResponse>("/api/admin/email-templates")
      setData(response)
      setSelectedKey((current) => current ?? response.templates[0]?.key ?? null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de charger les modèles d'emails")
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const selected = data?.templates.find((t) => t.key === selectedKey) ?? null

  useEffect(() => {
    if (selected) {
      setSubject(selected.subject)
      setBody(selected.body)
    }
  }, [selected])

  const isDirty = selected ? subject !== selected.subject || body !== selected.body : false
  const payload = () => ({ key: selectedKey, subject, body })

  const applyUpdate = (template: Partial<TemplateItem> & { key: EditableTemplateKey }) => {
    setData((current) =>
      current ? { ...current, templates: current.templates.map((t) => (t.key === template.key ? { ...t, ...template } : t)) } : current,
    )
  }

  const save = async () => {
    setBusy("save")
    try {
      const result = await apiJson<{ template: TemplateItem }>("/api/admin/email-templates", { method: "PUT", body: JSON.stringify(payload()) })
      applyUpdate(result.template)
      toast.success("Modèle enregistré")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'enregistrement")
    } finally {
      setBusy(null)
    }
  }

  const reset = async () => {
    if (!selectedKey) return
    setBusy("reset")
    try {
      const result = await apiJson<{ template: TemplateItem }>("/api/admin/email-templates", {
        method: "DELETE",
        body: JSON.stringify({ key: selectedKey }),
      })
      applyUpdate(result.template)
      toast.success("Modèle réinitialisé au texte par défaut")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la réinitialisation")
    } finally {
      setBusy(null)
    }
  }

  const showPreview = async () => {
    setBusy("preview")
    try {
      setPreview(await apiJson<{ subject: string; html: string }>("/api/admin/email-templates/preview", { method: "POST", body: JSON.stringify(payload()) }))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'aperçu")
    } finally {
      setBusy(null)
    }
  }

  const sendTest = async () => {
    setBusy("test")
    try {
      const result = await apiJson<{ message: string }>("/api/admin/email-templates/test", { method: "POST", body: JSON.stringify(payload()) })
      toast.success(result.message)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'envoi du test")
    } finally {
      setBusy(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Modèles d&#39;emails
        </CardTitle>
        <CardDescription>
          Personnalisez le texte des emails envoyés aux candidats. Les variables entre doubles accolades sont remplacées
          automatiquement ; les liens deviennent cliquables. Les emails techniques (bienvenue, confirmation de dépôt,
          mot de passe) ne sont pas modifiables.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!data || !selected ? (
          <p className="text-sm text-muted-foreground">Chargement...</p>
        ) : (
          <>
            <div className="space-y-2 max-w-md">
              <Label htmlFor="template-key">Modèle</Label>
              <Select value={selected.key} onValueChange={(value) => setSelectedKey(value as EditableTemplateKey)}>
                <SelectTrigger id="template-key">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {data.templates.map((t) => (
                    <SelectItem key={t.key} value={t.key}>
                      {t.label}
                      {t.isCustomized ? " (personnalisé)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{selected.description}</p>
              {selected.isCustomized && selected.updated_at && (
                <Badge variant="outline">Personnalisé le {formatDateTimeFr(selected.updated_at)}</Badge>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-subject">Sujet</Label>
              <Input id="template-subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-body">Contenu</Label>
              <Textarea id="template-body" value={body} onChange={(e) => setBody(e.target.value)} rows={14} maxLength={10000} className="font-mono text-sm" />
            </div>

            <div className="text-sm">
              <p className="font-medium mb-1">Variables disponibles</p>
              <ul className="flex flex-wrap gap-2">
                {selected.variables.map((variable) => (
                  <li key={variable}>
                    <button
                      type="button"
                      className="rounded border bg-muted px-2 py-0.5 font-mono text-xs hover:bg-muted/60"
                      title={data.variables[variable]}
                      onClick={() => setBody((b) => `${b}{{${variable}}}`)}
                    >
                      {`{{${variable}}}`}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={save} disabled={busy !== null || !isDirty}>
                <Save className="h-4 w-4 mr-2" />
                {busy === "save" ? "Enregistrement..." : "Enregistrer"}
              </Button>
              <Button onClick={showPreview} variant="outline" disabled={busy !== null}>
                <Eye className="h-4 w-4 mr-2" />
                Aperçu
              </Button>
              <Button onClick={sendTest} variant="outline" disabled={busy !== null || !smtpConfigured} title={smtpConfigured ? undefined : "Configurez le SMTP d'abord"}>
                <Send className="h-4 w-4 mr-2" />
                {busy === "test" ? "Envoi..." : "M'envoyer un test"}
              </Button>
              <Button onClick={reset} variant="ghost" disabled={busy !== null || (!selected.isCustomized && !isDirty)}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Texte par défaut
              </Button>
            </div>
          </>
        )}
      </CardContent>

      <Dialog open={preview !== null} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Aperçu : {preview?.subject}</DialogTitle>
            <DialogDescription>Rendu avec des données d&#39;exemple.</DialogDescription>
          </DialogHeader>
          {preview && (
            <iframe title="Aperçu de l'email" srcDoc={preview.html} sandbox="" className="w-full h-[70vh] rounded border bg-white" />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
