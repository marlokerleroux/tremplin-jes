/**
 * Seed de développement : crée un compte administrateur, une configuration de saison
 * et une configuration SMTP factice. Idempotent (upsert) et paramétrable par variables d'environnement :
 *   SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD (obligatoire), SEED_EDITION (défaut : année suivante).
 * Ne génère pas de créneaux : utilisez l'onglet Paramètres de l'administration.
 */
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@tremplin-jeunes-en-scene.fr").toLowerCase()
  const adminPassword = process.env.SEED_ADMIN_PASSWORD
  if (!adminPassword || adminPassword.length < 12) {
    throw new Error("SEED_ADMIN_PASSWORD (12 caractères minimum) est obligatoire pour lancer le seed.")
  }
  const edition = Number(process.env.SEED_EDITION || new Date().getFullYear() + 1)

  const adminPasswordHash = await bcrypt.hash(adminPassword, 12)
  await prisma.profile.upsert({
    where: { email: adminEmail },
    update: { role: "admin" },
    create: {
      email: adminEmail,
      password_hash: adminPasswordHash,
      first_name: "Admin",
      last_name: "Tremplin",
      role: "admin",
      accepted_privacy_policy: true,
      privacy_policy_accepted_at: new Date(),
    },
  })

  const existingConfig = await prisma.scheduleConfig.findFirst({ orderBy: { created_at: "asc" } })
  if (!existingConfig) {
    await prisma.scheduleConfig.create({
      data: { edition, is_validated: false, venue: "Espace Léo Ferré, Brest", audition_dates: [] },
    })
  }

  const existingSmtp = await prisma.smtpConfig.findFirst()
  if (!existingSmtp) {
    await prisma.smtpConfig.create({
      data: {
        smtp_host: process.env.SEED_SMTP_HOST || "smtp.example.com",
        smtp_port: Number(process.env.SEED_SMTP_PORT || 587),
        smtp_username: process.env.SEED_SMTP_USER || "noreply@example.com",
        smtp_password: process.env.SEED_SMTP_PASSWORD || "changeme",
        smtp_from_email: process.env.SEED_SMTP_FROM || "noreply@example.com",
        smtp_from_name: "Tremplin Jeunes en Scène",
        smtp_secure: false,
      },
    })
  }

  console.log(`Seed terminé : admin ${adminEmail}, édition ${existingConfig?.edition ?? edition}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
