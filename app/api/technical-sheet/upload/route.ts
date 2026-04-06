import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { uploadBlob } from "@/lib/blob-storage"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
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
    const application = await prisma.application.findFirst({
      where: { id: applicationId, user_id: session.user.id },
    })

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    // Upload to Azure Blob with a unique filename
    const filename = `technical-sheet-${applicationId}-${Date.now()}.pdf`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const blobUrl = await uploadBlob(filename, buffer, file.type)

    // Upsert the technical sheet record
    const existingSheet = await prisma.technicalSheet.findFirst({
      where: { application_id: applicationId },
    })

    if (existingSheet) {
      await prisma.technicalSheet.update({
        where: { id: existingSheet.id },
        data: { pdf_url: blobUrl },
      })
    } else {
      await prisma.technicalSheet.create({
        data: {
          application_id: applicationId,
          pdf_url: blobUrl,
        },
      })
    }

    try {
      const appData = await prisma.application.findUnique({
        where: { id: applicationId },
        select: {
          stage_name: true,
          profile: {
            select: {
              email: true,
              first_name: true,
              last_name: true,
            },
          },
        },
      })

      if (appData && appData.profile) {
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/email/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "technicalSheet",
            email: appData.profile.email,
            firstName: appData.profile.first_name,
            lastName: appData.profile.last_name,
            stageName: appData.stage_name,
          }),
        })
      }
    } catch (emailError) {
      console.error("Failed to send technical sheet email:", emailError)
      // Don't block upload if email fails
    }

    return NextResponse.json({
      url: blobUrl,
      filename: file.name,
      size: file.size,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
