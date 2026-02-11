import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  // Create admin account
  const adminPasswordHash = await bcrypt.hash("admin123", 12)
  await prisma.profile.upsert({
    where: { email: "admin@tremplin-jes.fr" },
    update: {},
    create: {
      email: "admin@tremplin-jes.fr",
      password_hash: adminPasswordHash,
      first_name: "Admin",
      last_name: "Tremplin",
      role: "admin",
      accepted_privacy_policy: true,
      privacy_policy_accepted_at: new Date(),
    },
  })

  // Create time slots - Samedi 31 janvier 2026 (10:00 - 18:30)
  const saturdaySlots: { start: string; end: string }[] = []
  for (let h = 10; h <= 18; h++) {
    for (let m = 0; m < 60; m += 10) {
      if (h === 18 && m > 20) break
      const start = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
      const endM = m + 10
      const endH = endM >= 60 ? h + 1 : h
      const end = `${String(endH).padStart(2, "0")}:${String(endM % 60).padStart(2, "0")}`
      saturdaySlots.push({ start, end })
    }
  }

  for (const slot of saturdaySlots) {
    await prisma.timeSlot.create({
      data: {
        date: "2026-01-31",
        start_time: slot.start,
        end_time: slot.end,
        is_available: true,
      },
    })
  }

  // Create time slots - Dimanche 1er février 2026 (10:00 - 18:30)
  for (const slot of saturdaySlots) {
    await prisma.timeSlot.create({
      data: {
        date: "2026-02-01",
        start_time: slot.start,
        end_time: slot.end,
        is_available: true,
      },
    })
  }

  // Create default schedule config
  await prisma.scheduleConfig.create({
    data: {
      is_validated: false,
      venue: "Espace Léo Ferré, Brest",
    },
  })

  // Create default SMTP config (placeholder)
  await prisma.smtpConfig.create({
    data: {
      smtp_host: "smtp.example.com",
      smtp_port: 587,
      smtp_username: "noreply@tremplin-jes.fr",
      smtp_password: "changeme",
      smtp_from_email: "noreply@tremplin-jes.fr",
      smtp_from_name: "Tremplin Jeunes en Scène",
      smtp_secure: false,
    },
  })

  console.log("Seed completed successfully")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
