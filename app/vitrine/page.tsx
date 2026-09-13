import { getVitrineData } from "@/lib/vitrine/site"
import { VitrineHome } from "@/components/vitrine/vitrine-site"

export const dynamic = "force-dynamic"

export default async function VitrinePage() {
  const data = await getVitrineData()
  return <VitrineHome data={data} />
}
