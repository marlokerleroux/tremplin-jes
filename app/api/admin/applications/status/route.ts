import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiAdmin } from "@/lib/auth-helpers"
import { applicationStatusSchema } from "@/lib/validation/application"
import { formatZodError } from "@/lib/validation/common"
import { sendApplicationValidatedEmail } from "@/lib/email/notifications"

export async function PUT(request: Request) {
  const authResult = await requireApiAdmin()
  if (!authResult.ok) return authResult.response

  try {
    const parsed = applicationStatusSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }
    const { applicationId, status } = parsed.data

    const existing = await prisma.application.findUnique({
      where: { id: applicationId },
      select: { status: true, profile: { select: { email: true, first_name: true, last_name: true } } },
    })
    if (!existing) {
      return NextResponse.json({ error: "Candidature introuvable" }, { status: 404 })
    }

    const application = await prisma.application.update({
      where: { id: applicationId },
      data: { status },
    })

    let emailSent = false
    if (status === "validated" && existing.status !== "validated") {
      const result = await sendApplicationValidatedEmail(
        existing.profile.email,
        existing.profile.first_name,
        existing.profile.last_name,
      )
      emailSent = result.success
    }

    return NextResponse.json({ success: true, status: application.status, emailSent })
  } catch (error) {
    console.error("Error updating application status:", error)
    return NextResponse.json({ error: "Erreur lors de la mise à jour du statut" }, { status: 500 })
  }
}
