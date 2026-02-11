import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  try {
    // Fetch all applications with profiles and time slots
    const applications = await prisma.application.findMany({
      include: {
        profile: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
            street_address: true,
            city: true,
            postal_code: true,
            phone: true,
          },
        },
        time_slot: {
          select: {
            date: true,
            start_time: true,
            end_time: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    })

    // Transform data for Excel export
    const excelData = applications.map((app) => {
      const members = (app.group_members as any[]) || []
      const membersList =
        members.length > 0
          ? members.map((m: any) => `${m.firstName} ${m.lastName} (né le ${m.birthDate})`).join("; ")
          : "N/A"

      return {
        "Nom de scène": app.stage_name,
        Type: app.application_type === "solo" ? "Solo" : "Groupe",
        "Genre musical": app.musical_style,
        Prénom: app.profile?.first_name || "",
        Nom: app.profile?.last_name || "",
        Email: app.profile?.email || "",
        Téléphone: app.profile?.phone || "",
        Adresse: app.profile?.street_address || "",
        "Code postal": app.profile?.postal_code || "",
        Ville: app.profile?.city || "",
        Instagram: app.instagram || "",
        "Membres du groupe": membersList,
        Biographie: app.biography,
        "Composition originale": app.has_original_composition ? "Oui" : "Non",
        SACEM: app.is_sacem_registered ? "Oui" : "Non",
        "Expérience scénique": app.has_stage_experience ? "Oui" : "Non",
        "Détails expérience": app.stage_experience_details || "",
        "Autorise diffusion": app.allows_broadcast ? "Oui" : "Non",
        "Date préférée": app.preferred_audition_date || "",
        "Créneau attribué": app.time_slot
          ? `${new Date(app.time_slot.date).toLocaleDateString("fr-FR")} ${app.time_slot.start_time}`
          : "",
        Statut: app.status === "validated" ? "Validée" : app.status === "rejected" ? "Refusée" : "En attente",
        "Date de candidature": new Date(app.created_at).toLocaleDateString("fr-FR"),
      }
    })

    return NextResponse.json(excelData)
  } catch (error) {
    console.error("Error exporting applications:", error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
