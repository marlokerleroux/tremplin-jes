"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Eye, ExternalLink, RotateCcw, Save, ScrollText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { apiJson } from "@/lib/admin-client"
import { formatDateTimeFr } from "@/lib/season"

interface RulesState {
  title: string
  body: string
  isCustomized: boolean
  updated_at: string | null
}

interface RulesResponse {
  rules: RulesState
  defaultTitle: string
  defaultBody: string
  variables: { key: string; label: string; value: string }[]
}

export function RulesPanel() {
  const [data, setData] = useState<RulesResponse | null>(null)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [busy, setBusy] = useState<string | null>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  const apply = (rules: RulesState) => {
    setData((current) => (current ? { ...current, rules } : current))
    setTitle(rules.title)
    setBody(rules.body)
  }

  const load = useCallback(async () => {
    try {
      const response = await apiJson<RulesResponse>("/api/admin/reglement")
      setData(response)
      setTitle(response.rules.title)
      setBody(response.rules.body)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de charger le règlement")
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const isDirty = data ? title !== data.rules.title || body !== data.rules.body : false
  const emptyVariables = data?.variables.filter((v) => !v.value && (body.includes(`{{${v.key}}}`) || title.includes(`{{${v.key}}}`))) ?? []

  const save = async () => {
    setBusy("save")
    try {
      const result = await apiJson<{ rules: RulesState }>("/api/admin/reglement", { method: "PUT", body: JSON.stringify({ title, body }) })
      apply(result.rules)
      toast.success("Règlement enregistré : le PDF est à jour pour les candidats")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'enregistrement")
    } finally {
      setBusy(null)
    }
  }

  const reset = async () => {
    if (!data) return
    if (data.rules.isCustomized && !window.confirm("Remplacer le règlement publié par le texte par défaut ?")) return
    if (!data.rules.isCustomized) {
      setTitle(data.defaultTitle)
      setBody(data.defaultBody)
      return
    }
    setBusy("reset")
    try {
      const result = await apiJson<{ rules: RulesState }>("/api/admin/reglement", { method: "DELETE" })
      apply(result.rules)
      toast.success("Règlement réinitialisé au texte par défaut")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la réinitialisation")
    } finally {
      setBusy(null)
    }
  }

  const preview = async () => {
    // Fenêtre ouverte immédiatement (au clic) pour ne pas être bloquée, puis remplie avec le PDF.
    const win = window.open("", "_blank")
    setBusy("preview")
    try {
      const response = await fetch("/api/admin/reglement/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
      })
      if (!response.ok) {
        const error = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(error.error || `Erreur ${response.status}`)
      }
      const url = URL.createObjectURL(await response.blob())
      if (win) win.location.href = url
      else window.location.href = url
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (error) {
      win?.close()
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'aperçu")
    } finally {
      setBusy(null)
    }
  }

  const insertVariable = (key: string) => {
    const token = `{{${key}}}`
    const textarea = bodyRef.current
    if (!textarea) {
      setBody((b) => `${b}${token}`)
      return
    }
    const { selectionStart, selectionEnd } = textarea
    setBody((b) => b.slice(0, selectionStart) + token + b.slice(selectionEnd))
    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(selectionStart + token.length, selectionStart + token.length)
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScrollText className="h-5 w-5" />
          Règlement du tremplin
        </CardTitle>
        <CardDescription>
          Le règlement est publié en PDF, généré automatiquement à partir de ce texte, sur le formulaire d&#39;inscription,
          l&#39;espace candidat et le site vitrine. Chaque enregistrement est publié immédiatement. Les variables entre
          doubles accolades reprennent les dates et le lieu de la saison (onglet Paramètres, ci-dessus).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!data ? (
          <p className="text-sm text-muted-foreground">Chargement...</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              {data.rules.isCustomized && data.rules.updated_at ? (
                <Badge variant="outline">Modifié le {formatDateTimeFr(data.rules.updated_at)}</Badge>
              ) : (
                <Badge variant="outline">Texte par défaut</Badge>
              )}
              <a href="/pdf/reglement.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                <ExternalLink className="h-4 w-4" />
                Voir le PDF publié
              </a>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rules-title">Titre</Label>
              <Input id="rules-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rules-body">Contenu</Label>
              <Textarea
                id="rules-body"
                ref={bodyRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={24}
                maxLength={50_000}
                className="font-mono text-sm"
              />
              <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Mise en forme</p>
                <ul className="space-y-0.5">
                  <li>
                    <code className="font-mono"># Titre</code> : titre de section ; <code className="font-mono">## Sous-titre</code> : sous-titre
                  </li>
                  <li>
                    <code className="font-mono">- texte</code> : puce ; <code className="font-mono">{"  - texte"}</code> (2 espaces avant) : sous-puce
                  </li>
                  <li>
                    <code className="font-mono">**texte**</code> : gras ; une ligne vide sépare les paragraphes
                  </li>
                </ul>
              </div>
            </div>

            <div className="text-sm">
              <p className="font-medium mb-1">Variables disponibles (cliquez pour insérer)</p>
              <ul className="flex flex-wrap gap-2">
                {data.variables.map((variable) => (
                  <li key={variable.key}>
                    <button
                      type="button"
                      className="rounded border bg-muted px-2 py-0.5 font-mono text-xs hover:bg-muted/60 wrap-anywhere text-left"
                      title={`${variable.label} : ${variable.value || "non renseigné"}`}
                      onClick={() => insertVariable(variable.key)}
                    >
                      {`{{${variable.key}}}`}
                      <span className="ml-1 font-sans text-muted-foreground">{variable.value ? `= ${variable.value}` : "(vide)"}</span>
                    </button>
                  </li>
                ))}
              </ul>
              {emptyVariables.length > 0 && (
                <p className="mt-2 text-xs text-yellow-800">
                  Non renseigné pour la saison en cours, apparaîtra vide dans le PDF : {emptyVariables.map((v) => v.label).join(", ")}.
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={save} disabled={busy !== null || !isDirty}>
                <Save className="h-4 w-4 mr-2" />
                {busy === "save" ? "Enregistrement..." : "Enregistrer et publier"}
              </Button>
              <Button onClick={preview} variant="outline" disabled={busy !== null}>
                <Eye className="h-4 w-4 mr-2" />
                {busy === "preview" ? "Génération..." : "Aperçu PDF"}
              </Button>
              <Button onClick={reset} variant="ghost" disabled={busy !== null || (!data.rules.isCustomized && title === data.defaultTitle && body === data.defaultBody)}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Texte par défaut
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
