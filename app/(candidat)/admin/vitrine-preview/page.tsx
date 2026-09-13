import type { Metadata } from "next"
import Link from "next/link"
import { requireAdmin } from "@/lib/auth-helpers"
import { getVitrineData } from "@/lib/vitrine/site"
import { isVitrineMode, VITRINE_MODE_LABELS } from "@/lib/vitrine/modes"
import { VitrineFooter, VitrineHeader, VitrineHome } from "@/components/vitrine/vitrine-site"

export const metadata: Metadata = { title: "Aperçu du site vitrine", robots: { index: false, follow: false } }
export const dynamic = "force-dynamic"

/** Aperçu privé du site vitrine dans un mode donné, avec les derniers réglages enregistrés. */
export default async function VitrinePreviewPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  await requireAdmin()
  const { mode } = await searchParams
  const data = await getVitrineData({ modeOverride: isVitrineMode(mode) ? mode : undefined })
  return (
    <div className="min-w-0 [overflow-wrap:anywhere]">
      <div className="bg-foreground text-background text-sm px-4 py-2 flex flex-wrap items-center justify-between gap-2">
        <span>
          Aperçu privé du site vitrine · mode <strong>{VITRINE_MODE_LABELS[data.config.mode].label}</strong>. Les liens d&#39;ancre du menu ne fonctionnent pas dans l&#39;aperçu.
        </span>
        <Link href="/admin" className="underline underline-offset-4">
          Retour à l&#39;administration
        </Link>
      </div>
      <VitrineHeader data={data} />
      <main>
        <VitrineHome data={data} />
      </main>
      <VitrineFooter />
    </div>
  )
}
