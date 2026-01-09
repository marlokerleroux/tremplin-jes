import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const body = await request.json()
    const { applicationId, updates } = body

    if (!applicationId) {
      return NextResponse.json({ error: "ID de candidature manquant" }, { status: 400 })
    }

    // Update the application
    const { data, error } = await supabase
      .from("applications")
      .update({
        stage_name: updates.stage_name,
        musical_style: updates.musical_style,
        biography: updates.biography,
        instagram: updates.instagram,
        has_original_composition: updates.has_original_composition,
        is_sacem_registered: updates.is_sacem_registered,
        has_stage_experience: updates.has_stage_experience,
        stage_experience_details: updates.stage_experience_details,
        group_members: updates.group_members,
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId)
      .select()
      .single()

    if (error) {
      console.error("Error updating application:", error)
      return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in update application:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
