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

  // Fetch all applications with technical sheets
  const { data: applications, error } = await supabase
    .from("applications")
    .select(
      `
      id,
      stage_name,
      technical_sheets(pdf_url)
    `,
    )
    .order("stage_name", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Filter applications that have technical sheets
  const sheetsData = applications
    .filter((app: any) => app.technical_sheets && app.technical_sheets.length > 0 && app.technical_sheets[0].pdf_url)
    .map((app: any) => ({
      stageName: app.stage_name,
      pdfUrl: app.technical_sheets[0].pdf_url,
    }))

  return NextResponse.json(sheetsData)
}
