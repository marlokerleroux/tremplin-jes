import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiAdmin } from "@/lib/auth-helpers"
import { finalistSchema } from "@/lib/validation/results"
import { formatZodError } from "@/lib/validation/common"

/** Marque ou retire une candidature de la liste des finalistes. */
export async function PUT(request: Request) {
  const authResult = await requireApiAdmin()
  if (!authResult.ok) return authResult.response

  try {
    const parsed = finalistSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }
    const { applicationId, isFinalist } = parsed.data
    const existing = await prisma.application.findUnique({ where: { id: applicationId }, select: { status: true } })
    if (!existing) return NextResponse.json({ error: "Candidature introuvable" }, { status: 404 })
    if (isFinalist && existing.status !== "validated") {
      return NextResponse.json({ error: "Seule une candidature validée peut être finaliste" }, { status: 400 })
    }
    await prisma.application.update({ where: { id: applicationId }, data: { is_finalist: isFinalist } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating finalist:", error)
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 })
  }
}
