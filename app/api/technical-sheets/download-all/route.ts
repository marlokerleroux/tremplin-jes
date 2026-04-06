import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  try {
    const technicalSheets = await prisma.technicalSheet.findMany({
      include: {
        application: {
          select: { stage_name: true },
        },
      },
      orderBy: {
        application: { stage_name: "asc" },
      },
    })

    const sheetsData = technicalSheets
      .filter((sheet) => sheet.pdf_url)
      .map((sheet) => ({
        stageName: sheet.application.stage_name,
        pdfUrl: sheet.pdf_url,
      }))

    console.log("[api] Found technical sheets:", sheetsData.length)

    return NextResponse.json(sheetsData)
  } catch (error) {
    console.error("[api] Error fetching technical sheets:", error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
