import { PrismaClient } from "@prisma/client"

// This fixture only runs against the isolated database created for the local preview.
const target = new URL(process.env.DATABASE_URL || "postgresql://invalid")
if (target.hostname !== "127.0.0.1" || target.port !== "54329" || target.pathname !== "/tremplin_local") {
  throw new Error("Refus : cette préparation est réservée à tremplin_local sur 127.0.0.1:54329.")
}

const prisma = new PrismaClient()
try {
  await prisma.$transaction([
    prisma.scheduleConfig.updateMany({
      data: {
        edition: 2027,
        registration_opens_at: new Date("2026-10-21T10:00:00.000Z"),
        registration_closes_at: new Date("2026-12-31T22:59:00.000Z"),
        audition_dates: ["2027-01-23", "2027-01-24"],
        age_reference_date: "2027-01-24",
        venue: "Actual académie, Brest",
        is_validated: false,
      },
    }),
    prisma.vitrineConfig.updateMany({ data: { mode: "preseason", edition: null } }),
  ])
  console.log("Aperçu local : édition 2027, palmarès 2026 et partenaires issus des migrations. Aucun compte candidat créé.")
} finally {
  await prisma.$disconnect()
}
