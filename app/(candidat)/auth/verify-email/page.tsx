import Link from "next/link"
import { CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getOptionalAuth } from "@/lib/auth-helpers"
import { verifyEmailToken, type VerifyOutcome } from "@/lib/email-verification"

export const dynamic = "force-dynamic"

const MESSAGES: Record<VerifyOutcome, { title: string; description: string; ok: boolean }> = {
  verified: { ok: true, title: "Adresse email confirmée", description: "Merci ! Vous pouvez maintenant déposer votre candidature depuis votre espace." },
  already_verified: { ok: true, title: "Adresse déjà confirmée", description: "Votre adresse email était déjà vérifiée. Vous pouvez accéder à votre espace." },
  expired: { ok: false, title: "Lien expiré", description: "Ce lien de confirmation a expiré. Connectez-vous à votre espace pour en recevoir un nouveau." },
  invalid: { ok: false, title: "Lien invalide", description: "Ce lien de confirmation n'est pas valide ou a déjà été utilisé. Connectez-vous à votre espace pour en recevoir un nouveau." },
}

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams
  const result = await verifyEmailToken(token ?? "")
  const message = MESSAGES[result.outcome]
  const session = await getOptionalAuth()
  const target = session?.user ? (message.ok ? "/apply" : "/dashboard") : "/auth/login"

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-gradient-to-br from-primary/10 via-white to-accent/10">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1 text-center">
            {message.ok ? (
              <CheckCircle2 className="h-12 w-12 mx-auto text-green-600" />
            ) : (
              <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
            )}
            <CardTitle className="text-2xl font-bold">{message.title}</CardTitle>
            <CardDescription>{message.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href={target}>{session?.user ? (message.ok ? "Déposer ma candidature" : "Accéder à mon espace") : "Se connecter"}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
