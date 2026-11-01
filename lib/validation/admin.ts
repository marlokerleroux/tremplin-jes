import { z } from "zod"
import { DOSSIER_REMINDER_LIMITS } from "@/lib/dossier-reminders"
import { emailSchema, hhmmSchema, isoDateSchema, optionalText, uuidSchema } from "./common"

export const assignSlotSchema = z.object({
  applicationId: uuidSchema,
  timeSlotId: uuidSchema,
})

export const removeSlotSchema = z.object({
  applicationId: uuidSchema,
})

export const auditionStatusSchema = z.object({
  applicationId: uuidSchema,
  hasArrived: z.boolean().default(false),
  isCheckedIn: z.boolean().default(false),
  hasPerformed: z.boolean().default(false),
})

export const auditionNotesSchema = z.object({
  applicationId: uuidSchema,
  notes: optionalText(2000),
})

export const smtpConfigSchema = z.object({
  smtp_host: z.string("Hôte SMTP requis").trim().min(1, "Hôte SMTP requis").max(255),
  smtp_port: z.coerce.number("Port invalide").int("Port invalide").min(1, "Port invalide").max(65535, "Port invalide"),
  smtp_username: z.string("Identifiant SMTP requis").trim().min(1, "Identifiant SMTP requis").max(255),
  // Vide = conserver le mot de passe enregistré.
  smtp_password: z.string().max(255).optional().default(""),
  smtp_from_email: emailSchema,
  smtp_from_name: z.string("Nom d'expéditeur requis").trim().min(1, "Nom d'expéditeur requis").max(100),
  smtp_secure: z.boolean().default(false),
})

export type SmtpConfigInput = z.infer<typeof smtpConfigSchema>

const optionalDateTime = z
  .string()
  .trim()
  .nullish()
  .transform((value, ctx) => {
    if (!value) return null
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      ctx.addIssue({ code: "custom", message: "Date et heure invalides" })
      return z.NEVER
    }
    return date
  })

export const seasonConfigSchema = z
  .object({
    edition: z.coerce.number("Édition invalide").int("Édition invalide").min(2000, "Édition invalide").max(2100, "Édition invalide"),
    registration_opens_at: optionalDateTime,
    registration_closes_at: optionalDateTime,
    audition_dates: z
      .array(isoDateSchema, "Dates d'audition invalides")
      .max(10, "10 dates d'audition maximum")
      .transform((dates) => Array.from(new Set(dates)).sort()),
    age_reference_date: isoDateSchema.nullish().transform((v) => v ?? null),
    venue: optionalText(200),
  })
  .superRefine((data, ctx) => {
    if (data.registration_opens_at && data.registration_closes_at && data.registration_opens_at >= data.registration_closes_at) {
      ctx.addIssue({
        code: "custom",
        path: ["registration_closes_at"],
        message: "La clôture des inscriptions doit être postérieure à l'ouverture",
      })
    }
  })

export type SeasonConfigInput = z.infer<typeof seasonConfigSchema>

export const dossierReminderSettingsSchema = z.object({
  enabled: z.boolean("Activation invalide"),
  intervalDays: z.coerce
    .number("Fréquence invalide")
    .int("Fréquence invalide")
    .min(DOSSIER_REMINDER_LIMITS.intervalDays.min, `Fréquence minimale : ${DOSSIER_REMINDER_LIMITS.intervalDays.min} jours`)
    .max(DOSSIER_REMINDER_LIMITS.intervalDays.max, `Fréquence maximale : ${DOSSIER_REMINDER_LIMITS.intervalDays.max} jours`),
  finalDays: z.coerce
    .number("Délai invalide")
    .int("Délai invalide")
    .min(DOSSIER_REMINDER_LIMITS.finalDays.min, "Délai invalide")
    .max(DOSSIER_REMINDER_LIMITS.finalDays.max, `Délai maximal : ${DOSSIER_REMINDER_LIMITS.finalDays.max} jours`),
})

export const generateSlotsSchema = z
  .object({
    date: isoDateSchema,
    startTime: hhmmSchema,
    endTime: hhmmSchema,
    durationMinutes: z.coerce.number("Durée invalide").int("Durée invalide").min(5, "Durée minimale : 5 minutes").max(240, "Durée maximale : 240 minutes"),
  })
  .refine((d) => d.startTime < d.endTime, { path: ["endTime"], message: "L'heure de fin doit être postérieure à l'heure de début" })

export const deleteSlotsSchema = z.object({
  date: isoDateSchema,
})

export const newSeasonSchema = z.object({
  edition: z.coerce.number("Édition invalide").int("Édition invalide").min(2000, "Édition invalide").max(2100, "Édition invalide"),
})

export const purgeEditionSchema = z
  .object({
    edition: z.coerce.number("Édition invalide").int("Édition invalide"),
    confirmation: z.string("Confirmation requise"),
  })
  .refine((d) => d.confirmation.trim() === `SUPPRIMER ${d.edition}`, {
    path: ["confirmation"],
    message: "Confirmation incorrecte",
  })
