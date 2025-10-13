import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { RegistrationForm } from "@/components/registration-form"

export default async function ApplyPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
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
