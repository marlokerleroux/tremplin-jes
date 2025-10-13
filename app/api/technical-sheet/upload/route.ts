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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const applicationId = formData.get("applicationId") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!applicationId) {
      return NextResponse.json({ error: "No application ID provided" }, { status: 400 })
    }

    // Verify file is a PDF
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 })
    }

    // Verify file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 10MB" }, { status: 400 })
    }

    // Verify the application belongs to the user
    const { data: application } = await supabase
      .from("applications")
      .select("id")
      .eq("id", applicationId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
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

    if (existingSheet) {
      // Update existing record
      await supabase
        .from("technical_sheets")
        .update({
          pdf_url: blob.url,
          validated: false, // Reset validation when new file is uploaded
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingSheet.id)
    } else {
      // Create new record
      await supabase.from("technical_sheets").insert({
        application_id: applicationId,
        pdf_url: blob.url,
        validated: false,
      })
    }

    try {
      const { data: appData } = await supabase
        .from("applications")
        .select(
          `
          stage_name,
          profiles:user_id (
            email,
            first_name,
            last_name
          )
        `,
        )
        .eq("id", applicationId)
        .single()

      if (appData && appData.profiles) {
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/email/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "technicalSheet",
            email: (appData.profiles as any).email,
            firstName: (appData.profiles as any).first_name,
            lastName: (appData.profiles as any).last_name,
            stageName: appData.stage_name,
          }),
        })
      }
    } catch (emailError) {
      console.error("Failed to send technical sheet email:", emailError)
      // Don't block upload if email fails
    }

    return NextResponse.json({
      url: blob.url,
      filename: file.name,
      size: file.size,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
