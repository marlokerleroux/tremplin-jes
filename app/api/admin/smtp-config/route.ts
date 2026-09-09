import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiAdmin } from "@/lib/auth-helpers"
import { smtpConfigSchema } from "@/lib/validation/admin"
import { formatZodError } from "@/lib/validation/common"

function mask(config: {
  id: string
  smtp_host: string
  smtp_port: number
  smtp_username: string
  smtp_password: string
  smtp_from_email: string
  smtp_from_name: string
  smtp_secure: boolean
}) {
  const { smtp_password, ...rest } = config
  return { ...rest, has_password: smtp_password.length > 0 }
}

export async function GET() {
  const authResult = await requireApiAdmin()
  if (!authResult.ok) return authResult.response

  try {
    const config = await prisma.smtpConfig.findFirst({ orderBy: { created_at: "asc" } })
    return NextResponse.json(config ? mask(config) : null)
  } catch (error) {
    console.error("Error fetching SMTP config:", error)
    return NextResponse.json({ error: "Erreur lors de la récupération de la configuration SMTP" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const authResult = await requireApiAdmin()
  if (!authResult.ok) return authResult.response

  try {
    const parsed = smtpConfigSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }
    const data = parsed.data

    const existing = await prisma.smtpConfig.findFirst({ orderBy: { created_at: "asc" } })
    const password = data.smtp_password || existing?.smtp_password || ""
    if (!password) {
      return NextResponse.json({ error: "Mot de passe SMTP requis" }, { status: 400 })
    }

    const values = {
      smtp_host: data.smtp_host,
      smtp_port: data.smtp_port,
      smtp_username: data.smtp_username,
      smtp_password: password,
      smtp_from_email: data.smtp_from_email,
      smtp_from_name: data.smtp_from_name,
      smtp_secure: data.smtp_secure,
    }

    const config = existing
      ? await prisma.smtpConfig.update({ where: { id: existing.id }, data: values })
      : await prisma.smtpConfig.create({ data: values })

    return NextResponse.json({ success: true, config: mask(config) })
  } catch (error) {
    console.error("Error updating SMTP config:", error)
    return NextResponse.json({ error: "Erreur lors de la mise à jour de la configuration SMTP" }, { status: 500 })
  }
}
