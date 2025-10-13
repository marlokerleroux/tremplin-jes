import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
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

    // Verify the application belongs to the user
    const { data: application } = await supabase
      .from("applications")
      .select("id")
      .eq("id", applicationId)
      .eq("user_id", user.id)
      .single()

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

    if (existing) {
      // Update existing record
      await supabase
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
    } else {
      await supabase.from("parental_authorizations").insert({
        application_id: applicationId,
        member_index: memberIndex,
        member_name: memberName,
        pdf_url: blob.url,
      })
    }

    return NextResponse.json({
      url: blob.url,
      filename: file.name,
      size: file.size,
    })
  } catch (error) {
    console.error("[v0] Error uploading parental authorization:", error)
    return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 })
  }
}
