import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const data = await prisma.auditionTracking.findMany()

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in audition tracking GET:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const body = await request.json()
    const { applicationId, hasArrived, isCheckedIn, hasPerformed } = body

    if (!applicationId) {
      return NextResponse.json({ error: "applicationId requis" }, { status: 400 })
    }

    const now = new Date()

    // Check if record exists to preserve existing timestamps
    const existing = await prisma.auditionTracking.findUnique({
      where: { application_id: applicationId },
    })

    const updateData = {
      has_arrived: hasArrived,
      arrived_at: hasArrived ? (existing?.arrived_at || now) : null,
      is_checked_in: isCheckedIn,
      checked_in_at: isCheckedIn ? (existing?.checked_in_at || now) : null,
      has_performed: hasPerformed,
      performed_at: hasPerformed ? (existing?.performed_at || now) : null,
    }

    const data = await prisma.auditionTracking.upsert({
      where: { application_id: applicationId },
      create: {
        application_id: applicationId,
        ...updateData,
      },
      update: updateData,
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in audition tracking API:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const body = await request.json()
    const { applicationId, notes } = body

    if (!applicationId) {
      return NextResponse.json({ error: "applicationId requis" }, { status: 400 })
    }

    const data = await prisma.auditionTracking.upsert({
      where: { application_id: applicationId },
      create: {
        application_id: applicationId,
        notes,
      },
      update: {
        notes,
      },
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in audition tracking PATCH:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
