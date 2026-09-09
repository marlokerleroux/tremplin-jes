"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Mail, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiJson } from "@/lib/admin-client"

interface SmtpForm {
  smtp_host: string
  smtp_port: string
  smtp_username: string
  smtp_password: string
  smtp_from_email: string
  smtp_from_name: string
  smtp_secure: boolean
}

interface SmtpConfigResponse {
  smtp_host: string
  smtp_port: number
  smtp_username: string
  smtp_from_email: string
  smtp_from_name: string
  smtp_secure: boolean
  has_password: boolean
}

const EMPTY: SmtpForm = {
  smtp_host: "",
  smtp_port: "587",
  smtp_username: "",
  smtp_password: "",
  smtp_from_email: "",
  smtp_from_name: "Tremplin Jeunes en Scène",
  smtp_secure: false,
}

export function SmtpSettings() {
  const [form, setForm] = useState<SmtpForm>(EMPTY)
  const [hasPassword, setHasPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  useEffect(() => {
    apiJson<SmtpConfigResponse | null>("/api/admin/smtp-config")
      .then((config) => {
        if (config) {
          setForm({
            smtp_host: config.smtp_host,
            smtp_port: String(config.smtp_port),
            smtp_username: config.smtp_username,
            smtp_password: "",
            smtp_from_email: config.smtp_from_email,
            smtp_from_name: config.smtp_from_name,
            smtp_secure: config.smtp_secure,
          })
          setHasPassword(config.has_password)
        }
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Impossible de charger la configuration SMTP"))
      .finally(() => setIsLoading(false))
  }, [])

  const payload = () => ({ ...form, smtp_port: Number(form.smtp_port) })

  const save = async () => {
    setIsSaving(true)
    try {
      await apiJson("/api/admin/smtp-config", { method: "PUT", body: JSON.stringify(payload()) })
      setHasPassword(true)
      setForm((f) => ({ ...f, smtp_password: "" }))
      toast.success("Paramètres SMTP enregistrés")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'enregistrement des paramètres SMTP")
    } finally {
      setIsSaving(false)
    }
  }

  const test = async () => {
    setIsTesting(true)
    try {
      const result = await apiJson<{ success: boolean; message: string }>("/api/admin/smtp-config/test", {
        method: "POST",
        body: JSON.stringify(payload()),
      })
      toast.success(result.message)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors du test de connexion SMTP")
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Envoi des emails (SMTP)
        </CardTitle>
        <CardDescription>
          Compte utilisé pour les emails automatiques (bienvenue, confirmation, validation, convocations, mot de passe).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement...</p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="smtp-host">Serveur SMTP</Label>
                <Input id="smtp-host" value={form.smtp_host} onChange={(e) => setForm({ ...form, smtp_host: e.target.value })} placeholder="smtp.example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-port">Port</Label>
                <Input id="smtp-port" type="number" min={1} max={65535} value={form.smtp_port} onChange={(e) => setForm({ ...form, smtp_port: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="smtp-username">Identifiant</Label>
                <Input id="smtp-username" autoComplete="off" value={form.smtp_username} onChange={(e) => setForm({ ...form, smtp_username: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-password">Mot de passe</Label>
                <Input
                  id="smtp-password"
                  type="password"
                  autoComplete="new-password"
                  value={form.smtp_password}
                  onChange={(e) => setForm({ ...form, smtp_password: e.target.value })}
                  placeholder={hasPassword ? "•••••••• (inchangé si vide)" : ""}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="smtp-from-email">Adresse d&#39;expédition</Label>
                <Input id="smtp-from-email" type="email" value={form.smtp_from_email} onChange={(e) => setForm({ ...form, smtp_from_email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-from-name">Nom d&#39;expéditeur</Label>
                <Input id="smtp-from-name" value={form.smtp_from_name} onChange={(e) => setForm({ ...form, smtp_from_name: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="smtp-secure" checked={form.smtp_secure} onCheckedChange={(checked) => setForm({ ...form, smtp_secure: checked === true })} />
              <Label htmlFor="smtp-secure" className="font-normal">
                Connexion TLS implicite (port 465). Décoché : STARTTLS (port 587).
              </Label>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={save} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Enregistrement..." : "Enregistrer"}
              </Button>
              <Button onClick={test} disabled={isTesting} variant="outline">
                {isTesting ? "Test en cours..." : "Envoyer un email de test"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
