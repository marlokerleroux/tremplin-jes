import { NextResponse } from "next/server"
import { requireApiAdmin } from "@/lib/auth-helpers"
import { sendResults } from "@/lib/results"
import { getSMTPConfig } from "@/lib/email/notifications"
import { sendResultsSchema } from "@/lib/validation/results"
import { formatZodError } from "@/lib/validation/common"

export const maxDuration = 60

/** Envoie les emails de résultat (finaliste / non retenu) à toutes les candidatures validées. */
export async function POST(request: Request) {
  const authResult = await requireApiAdmin()
  if (!authResult.ok) return authResult.response

  try {
    const parsed = sendResultsSchema.safeParse((await request.json().catch(() => ({}))) ?? {})
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }
    if (!(await getSMTPConfig())) {
      return NextResponse.json({ error: "Configuration SMTP absente : impossible d'envoyer les résultats" }, { status: 400 })
    }
    const report = await sendResults({ resend: parsed.data.resend })
    return NextResponse.json({ success: true, report })
  } catch (error) {
    console.error("Error sending results:", error)
    return NextResponse.json({ error: "Erreur lors de l'envoi des résultats" }, { status: 500 })
  }
}
