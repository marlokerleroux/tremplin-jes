import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiAdmin } from "@/lib/auth-helpers"
import { getSeasonConfig } from "@/lib/season-config"
import { deleteBlobs } from "@/lib/blob-storage"
import { purgeEditionSchema } from "@/lib/validation/admin"
import { formatZodError } from "@/lib/validation/common"

/**
 * Purge définitive d'une édition archivée : candidatures (et documents, suivi d'audition),
 * fichiers Vercel Blob et créneaux. Avec `?accounts=1`, supprime aussi les comptes candidats
 * qui n'ont plus aucune candidature.
 */
export async function DELETE(request: Request, context: { params: Promise<{ edition: string }> }) {
  const authResult = await requireApiAdmin()
  if (!authResult.ok) return authResult.response

  try {
    const { edition: rawEdition } = await context.params
    const body = await request.json().catch(() => ({}))
    const parsed = purgeEditionSchema.safeParse({ edition: rawEdition, confirmation: body?.confirmation })
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }
    const { edition } = parsed.data
    const purgeAccounts = new URL(request.url).searchParams.get("accounts") === "1"

    const config = await getSeasonConfig()
    if (edition === config.edition) {
      return NextResponse.json({ error: "Impossible de purger l'édition en cours" }, { status: 400 })
    }

    const applications = await prisma.application.findMany({
      where: { edition },
      select: {
        id: true,
        technical_sheet: { select: { pdf_url: true } },
        parental_authorizations: { select: { pdf_url: true } },
      },
    })
    const blobUrls = applications.flatMap((a) => [
      a.technical_sheet?.pdf_url,
      ...a.parental_authorizations.map((p) => p.pdf_url),
    ])

    const [deletedApplications, deletedSlots] = await prisma.$transaction([
      prisma.application.deleteMany({ where: { edition } }),
      prisma.timeSlot.deleteMany({ where: { edition } }),
    ])

    await deleteBlobs(blobUrls)

    let deletedAccounts = 0
    if (purgeAccounts) {
      const result = await prisma.profile.deleteMany({ where: { role: "user", applications: { none: {} } } })
      deletedAccounts = result.count
    }

    return NextResponse.json({
      success: true,
      deleted: {
        applications: deletedApplications.count,
        timeSlots: deletedSlots.count,
        files: blobUrls.filter(Boolean).length,
        accounts: deletedAccounts,
      },
    })
  } catch (error) {
    console.error("Error purging edition:", error)
    return NextResponse.json({ error: "Erreur lors de la purge de l'édition" }, { status: 500 })
  }
}
