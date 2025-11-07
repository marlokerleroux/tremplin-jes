import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()

  // Check if user is admin
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  // Fetch all applications with profiles
  const { data: applications, error } = await supabase
    .from("applications")
    .select(
      `
      *,
      profiles:user_id (
        first_name,
        last_name,
        email,
        street_address,
        city,
        postal_code,
        phone
      ),
      time_slots(date, start_time, end_time)
    `,
    )
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Transform data for Excel export
  const excelData = applications.map((app: any) => {
    const members = app.group_members || []
    const membersList =
      members.length > 0
        ? members.map((m: any) => `${m.firstName} ${m.lastName} (né le ${m.birthDate})`).join("; ")
        : "N/A"

    return {
      "Nom de scène": app.stage_name,
      Type: app.application_type === "solo" ? "Solo" : "Groupe",
      "Genre musical": app.musical_style,
      Prénom: app.profiles?.first_name || "",
      Nom: app.profiles?.last_name || "",
      Email: app.profiles?.email || "",
      Téléphone: app.profiles?.phone || "",
      Adresse: app.profiles?.street_address || "",
      "Code postal": app.profiles?.postal_code || "",
      Ville: app.profiles?.city || "",
      Instagram: app.instagram || "",
      "Membres du groupe": membersList,
      Biographie: app.biography,
      "Composition originale": app.has_original_composition ? "Oui" : "Non",
      SACEM: app.is_sacem_registered ? "Oui" : "Non",
      "Expérience scénique": app.has_stage_experience ? "Oui" : "Non",
      "Détails expérience": app.stage_experience_details || "",
      "Autorise diffusion": app.allows_broadcast ? "Oui" : "Non",
      "Date préférée": app.preferred_audition_date || "",
      "Créneau attribué": app.time_slots
        ? `${new Date(app.time_slots.date).toLocaleDateString("fr-FR")} ${app.time_slots.start_time}`
        : "",
      Statut: app.status === "validated" ? "Validée" : app.status === "rejected" ? "Refusée" : "En attente",
      "Date de candidature": new Date(app.created_at).toLocaleDateString("fr-FR"),
    }
  })

  return NextResponse.json(excelData)
}
