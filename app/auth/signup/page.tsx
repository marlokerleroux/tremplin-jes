"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { redirectAfterAuth } from "@/lib/redirect-after-auth"

export default function SignUpPage() {
  const registrationsClosed = new Date() >= new Date("2026-01-01T00:00:00")

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    streetAddress: "",
    city: "",
    postalCode: "",
    phone: "",
    password: "",
    confirmPassword: "",
    acceptedPrivacyPolicy: false,
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas")
      setIsLoading(false)
      return
    }

    const brittanyPostalCodes = ["29", "35", "22", "56"]
    const postalCodePrefix = formData.postalCode.substring(0, 2)
    if (!brittanyPostalCodes.includes(postalCodePrefix)) {
      setError(
        "L'inscription au Tremplin Jeunes en Scène est réservée aux résidents bretons (codes postaux : 22, 29, 35, 56)",
      )
      setIsLoading(false)
      return
    }

    if (!formData.acceptedPrivacyPolicy) {
      setError("Vous devez accepter la politique de confidentialité")
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            street_address: formData.streetAddress,
            city: formData.city,
            postal_code: formData.postalCode,
            phone: formData.phone,
            accepted_privacy_policy: formData.acceptedPrivacyPolicy,
            privacy_policy_accepted_at: new Date().toISOString(),
          },
        },
      })
      if (error) throw error

      if (data.user) {
        try {
          await fetch("/api/email/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "welcome",
              email: formData.email,
              firstName: formData.firstName,
              lastName: formData.lastName,
            }),
          })
        } catch (emailError) {
          console.error("Failed to send welcome email:", emailError)
        }
      }

      if (data.user && data.session) {
        const redirectPath = await redirectAfterAuth()
        router.push(redirectPath)
      } else {
        router.push("/auth/signup-success")
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }

  if (registrationsClosed) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-6 bg-gradient-to-br from-primary/10 via-white to-accent/10">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">Inscriptions closes</CardTitle>
              <CardDescription className="text-center">Tremplin Jeunes en Scène</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Les inscriptions sont terminées</AlertTitle>
                <AlertDescription>
                  Les inscriptions au Tremplin Jeunes en Scène se sont clôturées le 31 décembre 2025.
                </AlertDescription>
              </Alert>
              <p className="text-sm text-muted-foreground text-center">
                Si vous avez déjà un compte, vous pouvez vous connecter pour accéder à votre candidature.
              </p>
              <div className="space-y-2">
                <Button asChild variant="default" className="w-full">
                  <Link href="/auth/login">Se connecter</Link>
                </Button>
                <Button asChild variant="outline" className="w-full bg-transparent">
                  <Link href="/">Retour à l'accueil</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-gradient-to-br from-primary/10 via-white to-accent/10">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Créer un compte</CardTitle>
            <CardDescription className="text-center">Inscrivez-vous au Tremplin Jeunes en Scène </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Prénom"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Nom"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="streetAddress">Rue *</Label>
                <Input
                  id="streetAddress"
                  type="text"
                  placeholder="Numéro et nom de rue"
                  required
                  value={formData.streetAddress}
                  onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 space-y-2">
                  <Label htmlFor="postalCode">Code postal *</Label>
                  <Input
                    id="postalCode"
                    type="text"
                    placeholder="29000"
                    required
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="city">Ville *</Label>
                  <Input
                    id="city"
                    type="text"
                    placeholder="Ville"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="06 12 34 56 78"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe *</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="acceptedPrivacyPolicy"
                  checked={formData.acceptedPrivacyPolicy}
                  onCheckedChange={(checked) => setFormData({ ...formData, acceptedPrivacyPolicy: checked as boolean })}
                  required
                />
                <label htmlFor="acceptedPrivacyPolicy" className="text-sm leading-relaxed cursor-pointer">
                  J'accepte la{" "}
                  <Link
                    href="/privacy"
                    target="_blank"
                    className="text-primary underline underline-offset-4 hover:text-primary/80"
                  >
                    politique de confidentialité
                  </Link>{" "}
                  et le traitement de mes données personnelles *
                </label>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Création du compte..." : "Créer mon compte"}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              Déjà un compte ?{" "}
              <Link href="/auth/login" className="text-primary underline underline-offset-4 hover:text-primary/80">
                Se connecter
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
