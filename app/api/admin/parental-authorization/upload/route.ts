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
    const memberIndex = Number.parseInt(formData.get("memberIndex") as string)
    const memberName = formData.get("memberName") as string

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

    const filename = `parental-authorization-${applicationId}-member-${memberIndex}-${Date.now()}.pdf`
    const blob = await put(filename, file, {
      access: "public",
    })

    const { data: existing } = await supabase
      .from("parental_authorizations")
      .select("id")
      .eq("application_id", applicationId)
      .eq("member_index", memberIndex)
      .maybeSingle()

    let dbResult
    if (existing) {
      console.log("[v0] Updating existing parental auth:", existing.id)
      // Update existing record
      dbResult = await supabase
        .from("parental_authorizations")
        .update({
          pdf_url: blob.url,
          member_name: memberName,
          validated: false,
          validated_by: null,
          validated_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()

      console.log("[v0] Update result:", dbResult)
    } else {
      console.log("[v0] Creating new parental auth for application:", applicationId, "member:", memberIndex)
      dbResult = await supabase
        .from("parental_authorizations")
        .insert({
          application_id: applicationId,
          member_index: memberIndex,
          member_name: memberName,
          pdf_url: blob.url,
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
    console.error("Error uploading parental authorization:", error)
    return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 })
  }
}
