import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiAdmin } from "@/lib/auth-helpers"
import { getSeasonConfig } from "@/lib/season-config"
import { normalizeGroupMembers } from "@/lib/admin-data"
import { formatDateShortFr } from "@/lib/season"

/** Données à plat pour l'export Excel (édition en cours par défaut). */
export async function GET(request: Request) {
  const authResult = await requireApiAdmin()
  if (!authResult.ok) return authResult.response

  try {
    const config = await getSeasonConfig()
    const raw = new URL(request.url).searchParams.get("edition")
    const edition = raw ? Number.parseInt(raw, 10) : config.edition
    if (!Number.isInteger(edition)) {
      return NextResponse.json({ error: "Édition invalide" }, { status: 400 })
    }

    const applications = await prisma.application.findMany({
      where: { edition, profile: { role: { not: "admin" } } },
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
        time_slot: { select: { date: true, start_time: true, end_time: true } },
        technical_sheet: { select: { pdf_url: true } },
        parental_authorizations: { select: { member_index: true } },
      },
      orderBy: { created_at: "desc" },
    })

    const excelData = applications.map((app) => {
      const members = normalizeGroupMembers(app.group_members)
      const membersList =
        members.length > 0
          ? members.map((m) => `${m.firstName} ${m.lastName} (né le ${formatDateShortFr(m.birthDate)})`.trim()).join("; ")
          : "N/A"

      return {
        Édition: app.edition,
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
        "Date préférée": app.preferred_audition_date ? formatDateShortFr(app.preferred_audition_date) : "",
        "Créneau attribué": app.time_slot ? `${formatDateShortFr(app.time_slot.date)} ${app.time_slot.start_time}` : "",
        "Fiche technique": app.technical_sheet?.pdf_url ? "Oui" : "Non",
        "Autorisations parentales": app.parental_authorizations.length,
        Statut: app.status === "validated" ? "Validée" : app.status === "rejected" ? "Refusée" : "En attente",
        Finaliste: app.is_finalist ? "Oui" : "Non",
        "Résultat envoyé": app.result_sent_at ? new Date(app.result_sent_at).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" }) : "",
        "Date de candidature": new Date(app.created_at).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" }),
      }
    })

    return NextResponse.json(excelData)
  } catch (error) {
    console.error("Error exporting applications:", error)
    return NextResponse.json({ error: "Erreur lors de l'export" }, { status: 500 })
  }
}
