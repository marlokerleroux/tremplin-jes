import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiAdmin } from "@/lib/auth-helpers"
import { getVitrineEdition } from "@/lib/vitrine/site"
import { vitrineEditionSchema } from "@/lib/validation/vitrine"
import { formatZodError } from "@/lib/validation/common"

/** Finale, lauréats, après-finale, finalistes et tournée d'une édition. */
export async function PUT(request: Request) {
  const authResult = await requireApiAdmin()
  if (!authResult.ok) return authResult.response

  try {
    const parsed = vitrineEditionSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }
    const { edition, finalists, tour_dates, ...fields } = parsed.data
    const names = new Set(finalists.map((f) => f.name))
    if (fields.jury_winner && finalists.length > 0 && !names.has(fields.jury_winner)) {
      return NextResponse.json({ error: "Le prix du jury doit correspondre à un finaliste de la liste" }, { status: 400 })
    }
    if (fields.public_winner && finalists.length > 0 && !names.has(fields.public_winner)) {
      return NextResponse.json({ error: "Le prix du public doit correspondre à un finaliste de la liste" }, { status: 400 })
    }
    await prisma.vitrineEdition.upsert({
      where: { edition },
      create: { edition, ...fields, finalists, tour_dates },
      update: { ...fields, finalists, tour_dates },
    })
    return NextResponse.json({ success: true, edition: await getVitrineEdition(edition) })
  } catch (error) {
    console.error("Error saving vitrine edition:", error)
    return NextResponse.json({ error: "Erreur lors de l'enregistrement de l'édition" }, { status: 500 })
  }
}
