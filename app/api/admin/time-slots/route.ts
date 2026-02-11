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

    const timeSlots = await prisma.timeSlot.findMany({
      orderBy: [{ date: "asc" }, { start_time: "asc" }],
    })

    return NextResponse.json(timeSlots)
  } catch (error) {
    console.error("Error fetching time slots:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des créneaux" },
      { status: 500 }
    )
  }
}
