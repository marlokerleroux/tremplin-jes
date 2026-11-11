import { notFound } from "next/navigation"
import CommunicationDashboard from "@/components/communication/dashboard"

export const dynamic = "force-dynamic"
/** Local visual review only. No authentication bypass or production data. */
export default function Preview() {
  if (process.env.NODE_ENV !== "development") notFound()
  return <CommunicationDashboard preview />
}
