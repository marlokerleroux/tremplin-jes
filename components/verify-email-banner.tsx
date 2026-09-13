"use client"

import type React from "react"
import { useState } from "react"
import { toast } from "sonner"
import { MailWarning } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

/** Bandeau affiché tant que l'adresse email du candidat n'est pas confirmée. */
export function VerifyEmailBanner({ email }: { email: string }) {
  const [currentEmail, setCurrentEmail] = useState(email)
  const [newEmail, setNewEmail] = useState("")
  const [showChange, setShowChange] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const resend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setIsSending(true)
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: showChange && newEmail ? newEmail : null }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Envoi impossible")
      setCurrentEmail(data.email)
      setShowChange(false)
      setNewEmail("")
      toast.success("Email envoyé", { description: `Ouvrez le lien reçu sur ${data.email} (pensez à vérifier vos spams).` })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Envoi impossible")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="rounded-lg border border-orange-300 bg-orange-50 p-4 space-y-3" role="status">
      <div className="flex items-start gap-3">
        <MailWarning className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
        <div className="text-sm text-orange-900 leading-relaxed">
          <p className="font-semibold">Confirmez votre adresse email pour déposer votre candidature.</p>
          <p>
            Un lien de confirmation a été envoyé à <strong>{currentEmail}</strong>. Si vous ne le trouvez pas, vérifiez vos
            spams ou demandez un nouvel envoi. Adresse erronée ? Corrigez-la ci-dessous.
          </p>
        </div>
      </div>
      {showChange ? (
        <form onSubmit={resend} className="flex flex-col sm:flex-row gap-2 sm:items-end">
          <div className="flex-1 space-y-1">
            <Label htmlFor="new-email">Nouvelle adresse email</Label>
            <Input id="new-email" type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="votre@email.com" />
          </div>
          <Button type="submit" size="sm" disabled={isSending || !newEmail}>
            {isSending ? "Envoi..." : "Corriger et renvoyer"}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setShowChange(false)} disabled={isSending}>
            Annuler
          </Button>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => resend()} disabled={isSending}>
            {isSending ? "Envoi..." : "Renvoyer l'email de confirmation"}
          </Button>
          <Button size="sm" variant="outline" className="bg-transparent" onClick={() => setShowChange(true)} disabled={isSending}>
            Modifier mon adresse
          </Button>
        </div>
      )}
    </div>
  )
}
