import type { Metadata } from "next"
import CommunicationDashboard from "@/components/communication/dashboard"
export const metadata: Metadata = { title: "Espace communication · Tremplin", robots: { index: false, follow: false } }
export const dynamic = "force-dynamic"
export default function CommunicationPage() { return <CommunicationDashboard /> }
