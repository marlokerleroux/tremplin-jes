import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiAdmin } from "@/lib/auth-helpers"
import { removeSlotSchema } from "@/lib/validation/admin"
import { formatZodError } from "@/lib/validation/common"

export async function POST(request: Request) {
  const authResult = await requireApiAdmin()
  if (!authResult.ok) return authResult.response

  try {
    const parsed = removeSlotSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }
    const { applicationId } = parsed.data

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: { id: true, time_slot_id: true },
    })
    if (!application) {
      return NextResponse.json({ error: "Candidature introuvable" }, { status: 404 })
    }
    if (!application.time_slot_id) {
      return NextResponse.json({ error: "Aucun créneau attribué à cette candidature" }, { status: 400 })
    }

    await prisma.$transaction([
      prisma.application.update({ where: { id: application.id }, data: { time_slot_id: null } }),
      prisma.timeSlot.update({ where: { id: application.time_slot_id }, data: { is_available: true } }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing time slot:", error)
    return NextResponse.json({ error: "Erreur lors du retrait du créneau" }, { status: 500 })
  }
}
