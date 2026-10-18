import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiAdmin } from "@/lib/auth-helpers"
import { smtpConfigSchema } from "@/lib/validation/admin"
import { formatZodError } from "@/lib/validation/common"
import { sendTestEmail } from "@/lib/email/mailer"

/** Teste une configuration SMTP (mot de passe vide = mot de passe enregistré). */
export async function POST(request: Request) {
  const authResult = await requireApiAdmin()
  if (!authResult.ok) return authResult.response

  try {
    const parsed = smtpConfigSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: formatZodError(parsed.error) }, { status: 400 })
    }
    const data = parsed.data
    const existing = await prisma.smtpConfig.findFirst({ orderBy: { created_at: "asc" } })
    // Le mot de passe enregistré n'est réutilisé que pour le même serveur et le même compte :
    // il ne peut pas être envoyé vers un autre hôte sans être ressaisi.
    const sameServer =
      existing &&
      existing.smtp_host === data.smtp_host &&
      existing.smtp_port === data.smtp_port &&
      existing.smtp_username === data.smtp_username
    const password = data.smtp_password || (sameServer ? existing.smtp_password : "")
    if (!password) {
      return NextResponse.json({ success: false, message: "Mot de passe SMTP requis (à ressaisir si le serveur ou l'identifiant change)" }, { status: 400 })
    }

    const result = await sendTestEmail({ ...data, smtp_password: password })
    return NextResponse.json(result, { status: result.success ? 200 : 502 })
  } catch (error) {
    console.error("[smtp] test error:", error)
    return NextResponse.json({ success: false, message: "Erreur lors du test de connexion SMTP" }, { status: 500 })
  }
}
