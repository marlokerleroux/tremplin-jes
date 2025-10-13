import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function DELETE() {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Get user's application
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("id, status")
      .eq("user_id", user.id)
      .maybeSingle()

    if (appError) {
      console.error("[v0] Error fetching application:", appError)
      return NextResponse.json({ error: "Erreur lors de la récupération de la candidature" }, { status: 500 })
    }

    if (!application) {
      return NextResponse.json({ error: "Aucune candidature trouvée" }, { status: 404 })
    }

    // Check if application is validated
    if (application.status === "validated") {
      return NextResponse.json({ error: "Impossible de supprimer une candidature validée" }, { status: 403 })
    }

    // Delete technical sheet first (if exists)
    const { error: techSheetError } = await supabase
      .from("technical_sheets")
      .delete()
      .eq("application_id", application.id)

    if (techSheetError) {
      console.error("[v0] Error deleting technical sheet:", techSheetError)
      // Continue anyway, technical sheet might not exist
    }

    // Delete application
    const { error: deleteError } = await supabase.from("applications").delete().eq("id", application.id)

    if (deleteError) {
      console.error("[v0] Error deleting application:", deleteError)
      return NextResponse.json({ error: "Erreur lors de la suppression de la candidature" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
    return NextResponse.json({ error: "Erreur inattendue" }, { status: 500 })
  }
}
