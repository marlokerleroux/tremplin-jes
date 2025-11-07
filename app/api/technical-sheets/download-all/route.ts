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

  const { data: technicalSheets, error } = await supabase
    .from("technical_sheets")
    .select(
      `
      pdf_url,
      application_id,
      applications!inner(stage_name)
    `,
    )
    .order("applications(stage_name)", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching technical sheets:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const sheetsData = technicalSheets
    .filter((sheet: any) => sheet.pdf_url)
    .map((sheet: any) => ({
      stageName: sheet.applications.stage_name,
      pdfUrl: sheet.pdf_url,
    }))

  console.log("[v0] Found technical sheets:", sheetsData.length)

  return NextResponse.json(sheetsData)
}
