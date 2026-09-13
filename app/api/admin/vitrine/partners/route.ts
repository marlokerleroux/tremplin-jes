import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiAdmin } from "@/lib/auth-helpers"
import { listPartners } from "@/lib/vitrine/site"
import { partnersSchema } from "@/lib/validation/vitrine"
import { formatZodError } from "@/lib/validation/common"

/** Remplace la liste des partenaires (ordre = ordre de la liste). */
export async function PUT(request: Request) {
  const authResult = await requireApiAdmin()
  if (!authResult.ok) return authResult.response

  try {
    const parsed = partnersSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }
    const partners = parsed.data.partners
    const keepIds = partners.map((p) => p.id).filter((id): id is string => Boolean(id))
    await prisma.$transaction([
      prisma.vitrinePartner.deleteMany({ where: { id: { notIn: keepIds } } }),
      ...partners.map((p, position) =>
        p.id
          ? prisma.vitrinePartner.upsert({
              where: { id: p.id },
              create: { id: p.id, name: p.name, logo_url: p.logo_url, url: p.url, position, is_active: p.is_active },
              update: { name: p.name, logo_url: p.logo_url, url: p.url, position, is_active: p.is_active },
            })
          : prisma.vitrinePartner.create({ data: { name: p.name, logo_url: p.logo_url, url: p.url, position, is_active: p.is_active } }),
      ),
    ])
    return NextResponse.json({ success: true, partners: await listPartners(false) })
  } catch (error) {
    console.error("Error saving partners:", error)
    return NextResponse.json({ error: "Erreur lors de l'enregistrement des partenaires" }, { status: 500 })
  }
}
