import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiAdmin } from "@/lib/auth-helpers"
import { auditionNotesSchema, auditionStatusSchema } from "@/lib/validation/admin"
import { formatZodError } from "@/lib/validation/common"

export async function GET(request: Request) {
  const authResult = await requireApiAdmin()
  if (!authResult.ok) return authResult.response

  try {
    const raw = new URL(request.url).searchParams.get("edition")
    const edition = raw ? Number.parseInt(raw, 10) : undefined
    const data = await prisma.auditionTracking.findMany({
      where: edition && Number.isInteger(edition) ? { application: { edition } } : undefined,
    })
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in audition tracking GET:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const authResult = await requireApiAdmin()
  if (!authResult.ok) return authResult.response

  try {
    const parsed = auditionStatusSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }
    const { applicationId, hasArrived, isCheckedIn, hasPerformed } = parsed.data

    const now = new Date()
    const existing = await prisma.auditionTracking.findUnique({ where: { application_id: applicationId } })

    const updateData = {
      has_arrived: hasArrived,
      arrived_at: hasArrived ? (existing?.arrived_at ?? now) : null,
      is_checked_in: isCheckedIn,
      checked_in_at: isCheckedIn ? (existing?.checked_in_at ?? now) : null,
      has_performed: hasPerformed,
      performed_at: hasPerformed ? (existing?.performed_at ?? now) : null,
    }

    const data = await prisma.auditionTracking.upsert({
      where: { application_id: applicationId },
      create: { application_id: applicationId, ...updateData },
      update: updateData,
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in audition tracking API:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const authResult = await requireApiAdmin()
  if (!authResult.ok) return authResult.response

  try {
    const parsed = auditionNotesSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }
    const { applicationId, notes } = parsed.data

    const data = await prisma.auditionTracking.upsert({
      where: { application_id: applicationId },
      create: { application_id: applicationId, notes },
      update: { notes },
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in audition tracking PATCH:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
