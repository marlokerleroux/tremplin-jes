import { NextResponse } from "next/server"
import { requireApiAdmin } from "@/lib/auth-helpers"
import { runReminders } from "@/lib/reminders-runner"
import { runDossierReminders } from "@/lib/dossier-reminders-runner"

export const maxDuration = 60

/** Exécution manuelle des rappels et relances (même logique que la tâche planifiée quotidienne). */
export async function POST() {
  const authResult = await requireApiAdmin()
  if (!authResult.ok) return authResult.response

  try {
    const [result, dossier] = await Promise.all([runReminders(), runDossierReminders()])
    return NextResponse.json({ success: true, result, dossier })
  } catch (error) {
    console.error("Error running reminders:", error)
    return NextResponse.json({ error: "Erreur lors de l'envoi des rappels" }, { status: 500 })
  }
}
