import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/auth-helpers"
import { RegistrationForm } from "@/components/registration-form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import Link from "next/link"
import { getCurrentApplication, getSeasonState } from "@/lib/season-config"
import { formatDateTimeFr } from "@/lib/season"

export default async function ApplyPage() {
  const session = await requireAuth()
  const season = await getSeasonState()

  if (season.registration !== "open") {
    const closed = season.registration === "closed"
    const closesAt = season.config.registration_closes_at
    const opensAt = season.config.registration_opens_at
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-accent/10 py-12 px-4">
        <div className="container mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-foreground mb-3">
              {closed ? "Inscriptions closes" : "Inscriptions bientôt ouvertes"}
            </h1>
            <p className="text-foreground/70 text-lg leading-relaxed">Tremplin Jeunes en Scène · édition {season.config.edition}</p>
          </div>
          <Alert variant={closed ? "destructive" : "default"} className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{closed ? "Les inscriptions sont terminées" : "Un peu de patience"}</AlertTitle>
            <AlertDescription>
              {closed
                ? `Les inscriptions se sont clôturées${closesAt ? ` le ${formatDateTimeFr(closesAt)}` : ""}. Il n'est plus possible de déposer une nouvelle candidature.`
                : `Les inscriptions ouvriront${opensAt ? ` le ${formatDateTimeFr(opensAt)}` : " prochainement"}.`}
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

  const existingApplication = await getCurrentApplication(session.user.id, season.config.edition)
  if (existingApplication) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-accent/10 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-3">Formulaire d&#39;inscription</h1>
          <p className="text-foreground/70 text-lg leading-relaxed">
            Complétez votre candidature pour l&#39;édition {season.config.edition} du Tremplin Jeunes en Scène
          </p>
        </div>
        <RegistrationForm
          ageReferenceDate={season.ageReferenceDate}
          auditionDates={season.config.audition_dates}
          venue={season.venue}
        />
      </div>
    </div>
  )
}
