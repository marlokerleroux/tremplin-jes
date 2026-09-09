import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { getOptionalAuth } from "@/lib/auth-helpers"
import { getSeasonState } from "@/lib/season-config"
import { formatDateTimeFr } from "@/lib/season"
import { SignupForm } from "@/components/signup-form"

export default async function SignUpPage() {
  const session = await getOptionalAuth()
  if (session?.user) {
    redirect(session.user.role === "admin" ? "/admin" : "/dashboard")
  }

  const season = await getSeasonState()

  if (season.registration !== "open") {
    const closed = season.registration === "closed"
    const closesAt = season.config.registration_closes_at
    const opensAt = season.config.registration_opens_at
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-6 bg-gradient-to-br from-primary/10 via-white to-accent/10">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">
                {closed ? "Inscriptions closes" : "Inscriptions bientôt ouvertes"}
              </CardTitle>
              <CardDescription className="text-center">Tremplin Jeunes en Scène · édition {season.config.edition}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant={closed ? "destructive" : "default"}>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{closed ? "Les inscriptions sont terminées" : "Les inscriptions ne sont pas encore ouvertes"}</AlertTitle>
                <AlertDescription>
                  {closed
                    ? `Les inscriptions se sont clôturées${closesAt ? ` le ${formatDateTimeFr(closesAt)}` : ""}.`
                    : `Les inscriptions ouvriront${opensAt ? ` le ${formatDateTimeFr(opensAt)}` : " prochainement"}.`}
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
                  <Link href="/">Retour à l&#39;accueil</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return <SignupForm edition={season.config.edition} />
}
