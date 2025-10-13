import { type NextRequest, NextResponse } from "next/server"
import {
  sendWelcomeEmail,
  sendApplicationSubmittedEmail,
  sendTechnicalSheetSubmittedEmail,
  sendApplicationValidatedEmail,
  sendTimeSlotAssignedEmail,
} from "@/lib/email/notifications"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, ...data } = body

    switch (type) {
      case "welcome":
        await sendWelcomeEmail(data.email, data.firstName, data.lastName)
        break

      case "application_submitted":
        await sendApplicationSubmittedEmail(data.email, data.firstName, data.lastName, data.applicationType)
        break

      case "technicalSheet":
        await sendTechnicalSheetSubmittedEmail(data.email, data.firstName, data.lastName)
        break

      case "application_validated":
        await sendApplicationValidatedEmail(data.email, data.firstName, data.lastName)
        break

      case "time_slot_assigned":
        await sendTimeSlotAssignedEmail(data.email, data.firstName, data.lastName, data.date, data.time, data.venue)
        break

      default:
        return NextResponse.json({ success: false, message: "Type d'email invalide" }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: "Email envoyé avec succès" })
  } catch (error) {
    console.error("Error sending email:", error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Erreur lors de l'envoi de l'email" },
      { status: 500 },
    )
  }
}
