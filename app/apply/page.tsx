import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { RegistrationForm } from "@/components/registration-form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

export default async function ApplyPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const registrationsClosed = new Date() >= new Date("2026-01-01T00:00:00")

  if (registrationsClosed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-accent/10 py-12 px-4">
        <div className="container mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-foreground mb-3">Inscriptions closes</h1>
            <p className="text-foreground/70 text-lg leading-relaxed">Tremplin Jeunes en Scène</p>
          </div>
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Les inscriptions sont terminées</AlertTitle>
            <AlertDescription>
              Les inscriptions au Tremplin Jeunes en Scène se sont clôturées le 31 décembre 2025. Il n'est plus possible
              de déposer une nouvelle candidature.
            </AlertDescription>
          </Alert>
          <div className="flex justify-center">
            <Button asChild variant="default">
              <Link href="/dashboard">Retour au tableau de bord</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Check if user already has an application
  const { data: existingApplication } = await supabase
    .from("applications")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (existingApplication) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-accent/10 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-3">Formulaire d'inscription</h1>
          <p className="text-foreground/70 text-lg leading-relaxed">
            Complétez votre candidature pour le Tremplin Jeunes en Scène
          </p>
        </div>
        <RegistrationForm userId={user.id} />
      </div>
    </div>
  )
}
