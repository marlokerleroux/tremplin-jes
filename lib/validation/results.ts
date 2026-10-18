import { z } from "zod"
import { emailSchema, uuidSchema } from "./common"
import { EDITABLE_TEMPLATE_KEYS } from "@/lib/email/editable-templates"

export const finalistSchema = z.object({
  applicationId: uuidSchema,
  isFinalist: z.boolean(),
})

export const sendResultsSchema = z.object({
  resend: z.boolean().default(false),
})

export const templateKeySchema = z.enum(EDITABLE_TEMPLATE_KEYS, "Modèle inconnu")

export const emailTemplateSchema = z.object({
  key: templateKeySchema,
  subject: z.string("Sujet requis").trim().min(1, "Sujet requis").max(200, "Sujet trop long (200 caractères maximum)"),
  body: z.string("Contenu requis").trim().min(1, "Contenu requis").max(10_000, "Contenu trop long (10 000 caractères maximum)"),
})

export const templateKeyOnlySchema = z.object({ key: templateKeySchema })

export const resendVerificationSchema = z.object({
  email: emailSchema.nullish().transform((v) => v ?? null),
})

export const rulesSchema = z.object({
  title: z.string("Titre requis").trim().min(1, "Titre requis").max(200, "Titre trop long (200 caractères maximum)"),
  body: z.string("Contenu requis").trim().min(1, "Contenu requis").max(50_000, "Règlement trop long (50 000 caractères maximum)"),
})
