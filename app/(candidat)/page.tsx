import { getOptionalAuth } from "@/lib/auth-helpers"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Music } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Footer } from "@/components/footer"

export default async function HomePage() {
  const session = await getOptionalAuth()

  if (session?.user) {
    if (session.user.role === "admin") {
      redirect("/admin")
    } else {
      redirect("/dashboard")
    }
  }

  const registrationsClosed = new Date() >= new Date("2026-01-01T00:00:00")

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-primary/10 via-white to-accent/10">
        <div className="w-full max-w-md space-y-6">
          {/* Logo */}
          <div className="flex justify-center">
            <Image
              src="/images/design-mode/logo_sans_fond.png"
              alt="Tremplin Jeunes en Scène"
              width={300}
              height={90}
              className="h-20 w-auto"
            />
          </div>

          {/* Tagline */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Bienvenue</h1>
            <p className="text-foreground/70 text-pretty leading-relaxed">
              Le talent n&#39;attend pas le nombre d&#39;années
            </p>
          </div>

          {registrationsClosed && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Inscriptions closes</AlertTitle>
              <AlertDescription>
                Les inscriptions au Tremplin Jeunes en Scène se sont clôturées le 31 décembre 2025.
              </AlertDescription>
            </Alert>
          )}

          {/* Auth Options */}
          <div className="grid gap-4">
            <Card
              className={`border-2 transition-colors ${
                registrationsClosed ? "border-muted/20 opacity-60" : "border-primary/20 hover:border-primary/40"
              }`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5 text-primary" />
                  Nouvelle candidature
                </CardTitle>
                <CardDescription>
                  {registrationsClosed
                    ? "Les inscriptions sont closes"
                    : "Créez votre compte et déposez votre candidature"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  asChild={!registrationsClosed}
                  className="w-full bg-primary hover:bg-primary/90"
                  size="lg"
                  disabled={registrationsClosed}
                >
                  {registrationsClosed ? <span>Inscriptions closes</span> : <Link href="/auth/signup">S'inscrire</Link>}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-accent/20 hover:border-accent/40 transition-colors">
              <CardHeader>
                <CardTitle>Déjà inscrit ?</CardTitle>
                <CardDescription>Accédez à votre espace pour suivre votre candidature</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  asChild
                  variant="outline"
                  className="w-full border-accent text-accent hover:bg-accent hover:text-accent-foreground bg-transparent"
                  size="lg"
                >
                  <Link href="/auth/login">Se connecter</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Footer info */}
          <p className="text-center text-sm text-foreground/60">Pour les jeunes musiciens bretons de 13 à 23 ans</p>
        </div>
      </div>
      <Footer />
    </div>
  )
}
