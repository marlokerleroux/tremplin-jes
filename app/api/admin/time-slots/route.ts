import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiAdmin } from "@/lib/auth-helpers"
import { listTimeSlots } from "@/lib/admin-data"
import { getSeasonConfig } from "@/lib/season-config"
import { generateTimeSlots } from "@/lib/season"
import { deleteSlotsSchema, generateSlotsSchema } from "@/lib/validation/admin"
import { formatZodError } from "@/lib/validation/common"

export async function GET(request: Request) {
  const authResult = await requireApiAdmin()
  if (!authResult.ok) return authResult.response

  try {
    const config = await getSeasonConfig()
    const raw = new URL(request.url).searchParams.get("edition")
    const edition = raw ? Number.parseInt(raw, 10) : config.edition
    if (!Number.isInteger(edition)) {
      return NextResponse.json({ error: "Édition invalide" }, { status: 400 })
    }
    return NextResponse.json(await listTimeSlots(edition))
  } catch (error) {
    console.error("Error fetching time slots:", error)
    return NextResponse.json({ error: "Erreur lors de la récupération des créneaux" }, { status: 500 })
  }
}

/** Génère des créneaux pour une date de l'édition en cours (les créneaux existants sont conservés). */
export async function POST(request: Request) {
  const authResult = await requireApiAdmin()
  if (!authResult.ok) return authResult.response

  try {
    const parsed = generateSlotsSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }
    const config = await getSeasonConfig()
    const slots = generateTimeSlots(parsed.data)
    if (slots.length === 0) {
      return NextResponse.json({ error: "Aucun créneau à générer avec ces paramètres" }, { status: 400 })
    }

    const existing = await prisma.timeSlot.findMany({
      where: { edition: config.edition, date: parsed.data.date },
      select: { start_time: true },
    })
    const taken = new Set(existing.map((s) => s.start_time))
    const toCreate = slots.filter((s) => !taken.has(s.start_time))

    if (toCreate.length > 0) {
      await prisma.timeSlot.createMany({
        data: toCreate.map((s) => ({ ...s, edition: config.edition })),
      })
    }

    // La date est ajoutée automatiquement aux dates d'audition de la saison.
    if (!config.audition_dates.includes(parsed.data.date)) {
      await prisma.scheduleConfig.update({
        where: { id: config.id },
        data: { audition_dates: [...config.audition_dates, parsed.data.date].sort() },
      })
    }

    return NextResponse.json({ success: true, created: toCreate.length, skipped: slots.length - toCreate.length })
  } catch (error) {
    console.error("Error generating time slots:", error)
    return NextResponse.json({ error: "Erreur lors de la génération des créneaux" }, { status: 500 })
  }
}

/** Supprime les créneaux non attribués d'une date de l'édition en cours. */
export async function DELETE(request: Request) {
  const authResult = await requireApiAdmin()
  if (!authResult.ok) return authResult.response

  try {
    const parsed = deleteSlotsSchema.safeParse({ date: new URL(request.url).searchParams.get("date") })
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }
    const config = await getSeasonConfig()
    const result = await prisma.timeSlot.deleteMany({
      where: { edition: config.edition, date: parsed.data.date, application: null },
    })
    const remaining = await prisma.timeSlot.count({ where: { edition: config.edition, date: parsed.data.date } })
    return NextResponse.json({ success: true, deleted: result.count, remaining })
  } catch (error) {
    console.error("Error deleting time slots:", error)
    return NextResponse.json({ error: "Erreur lors de la suppression des créneaux" }, { status: 500 })
  }
}
