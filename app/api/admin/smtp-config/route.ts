import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const config = await prisma.smtpConfig.findFirst()

    return NextResponse.json(config)
  } catch (error) {
    console.error("Error fetching SMTP config:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la configuration SMTP" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const body = await request.json()

    // Find existing config or create one
    const existing = await prisma.smtpConfig.findFirst()

    let config
    if (existing) {
      config = await prisma.smtpConfig.update({
        where: { id: existing.id },
        data: {
          smtp_host: body.smtp_host,
          smtp_port: body.smtp_port,
          smtp_username: body.smtp_username,
          smtp_password: body.smtp_password,
          smtp_from_email: body.smtp_from_email,
          smtp_from_name: body.smtp_from_name,
          smtp_secure: body.smtp_secure,
        },
      })
    } else {
      config = await prisma.smtpConfig.create({
        data: {
          smtp_host: body.smtp_host,
          smtp_port: body.smtp_port ?? 587,
          smtp_username: body.smtp_username,
          smtp_password: body.smtp_password,
          smtp_from_email: body.smtp_from_email,
          smtp_from_name: body.smtp_from_name ?? "Tremplin Jeunes en Scène",
          smtp_secure: body.smtp_secure ?? false,
        },
      })
    }

    return NextResponse.json({ success: true, config })
  } catch (error) {
    console.error("Error updating SMTP config:", error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la configuration SMTP" },
      { status: 500 }
    )
  }
}
