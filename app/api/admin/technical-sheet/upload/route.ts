import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication and admin role
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Verify user is admin
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé - accès administrateur requis" }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const applicationId = formData.get("applicationId") as string

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 })
    }

    if (!applicationId) {
      return NextResponse.json({ error: "ID de candidature manquant" }, { status: 400 })
    }

    // Verify file is a PDF
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Seuls les fichiers PDF sont acceptés" }, { status: 400 })
    }

    // Verify file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Le fichier ne doit pas dépasser 10 MB" }, { status: 400 })
    }

    // Verify the application exists
    const { data: application } = await supabase.from("applications").select("id").eq("id", applicationId).maybeSingle()

    if (!application) {
      return NextResponse.json({ error: "Candidature non trouvée" }, { status: 404 })
    }

    // Upload to Vercel Blob with a unique filename
    const filename = `technical-sheet-${applicationId}-${Date.now()}.pdf`
    const blob = await put(filename, file, {
      access: "public",
    })

    // Save or update the technical sheet record
    const { data: existingSheet } = await supabase
      .from("technical_sheets")
      .select("id")
      .eq("application_id", applicationId)
      .maybeSingle()

    let dbResult
    if (existingSheet) {
      console.log("[v0] Updating existing technical sheet:", existingSheet.id)
      // Update existing record
      dbResult = await supabase
        .from("technical_sheets")
        .update({
          pdf_url: blob.url,
          validated: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingSheet.id)
        .select()

      console.log("[v0] Update result:", dbResult)
    } else {
      console.log("[v0] Creating new technical sheet for application:", applicationId)
      // Create new record
      dbResult = await supabase
        .from("technical_sheets")
        .insert({
          application_id: applicationId,
          pdf_url: blob.url,
          validated: false,
        })
        .select()

      console.log("[v0] Insert result:", dbResult)
    }

    if (dbResult.error) {
      console.error("[v0] Database error:", dbResult.error)
      return NextResponse.json({ error: "Erreur lors de la sauvegarde en base de données" }, { status: 500 })
    }

    return NextResponse.json({
      url: blob.url,
      filename: file.name,
      size: file.size,
      success: true,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 })
  }
}
