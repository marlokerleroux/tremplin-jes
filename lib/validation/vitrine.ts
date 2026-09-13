import { z } from "zod"
import { VITRINE_MODES } from "@/lib/vitrine/modes"
import { isoDateSchema, optionalText, uuidSchema } from "./common"

const optionalUrl = z
  .string()
  .trim()
  .max(500, "Lien trop long")
  .nullish()
  .transform((value, ctx) => {
    if (!value) return null
    if (!/^https?:\/\//i.test(value)) {
      ctx.addIssue({ code: "custom", message: "Le lien doit commencer par http:// ou https://" })
      return z.NEVER
    }
    return value
  })

/** Chemin d'image accepté : fichier du site (/images/...) ou média envoyé depuis l'administration. */
const imagePath = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || v.startsWith("/images/") || v.startsWith("/api/vitrine/media/"), "Image invalide")

export const vitrineConfigSchema = z.object({
  mode: z.enum(VITRINE_MODES, "Mode inconnu"),
  banner_enabled: z.boolean().default(false),
  banner_text: optionalText(300),
  banner_url: optionalUrl,
  auditions_intro: optionalText(2000),
  preseason_text: optionalText(1000),
})

export const finalistSchema = z.object({
  id: z.string().trim().min(1).max(60),
  name: z.string("Nom requis").trim().min(1, "Nom du finaliste requis").max(100),
  genre: z.string().trim().max(100).default(""),
  description: z.string().trim().max(1500, "Description trop longue (1500 caractères maximum)").default(""),
  image: imagePath.default(""),
  youtubeId: z.string().trim().max(30).regex(/^[A-Za-z0-9_-]*$/, "Identifiant YouTube invalide").default(""),
})

export const tourDateSchema = z.object({
  date: isoDateSchema,
  name: z.string("Nom du festival requis").trim().min(1, "Nom du festival requis").max(150),
  city: z.string().trim().max(100).default(""),
  url: optionalUrl.transform((v) => v ?? ""),
})

const optionalDateTime = z
  .string()
  .trim()
  .nullish()
  .transform((value, ctx) => {
    if (!value) return null
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      ctx.addIssue({ code: "custom", message: "Date de la finale invalide" })
      return z.NEVER
    }
    return date
  })

export const vitrineEditionSchema = z.object({
  edition: z.coerce.number("Édition invalide").int().min(2000).max(2100),
  anniversary_label: optionalText(100),
  final_date: optionalDateTime,
  final_venue: optionalText(150),
  final_address: optionalText(200),
  final_city: optionalText(100),
  ticket_url: optionalUrl,
  pass_culture_url: optionalUrl,
  price_label: optionalText(60),
  jury_prize_text: optionalText(1000),
  public_prize_text: optionalText(1000),
  jury_winner: optionalText(100),
  public_winner: optionalText(100),
  aftermath_text: optionalText(3000),
  aftermath_video_url: optionalUrl,
  aftermath_photos_url: optionalUrl,
  finalists: z.array(finalistSchema).max(12, "12 finalistes maximum").default([]),
  tour_dates: z.array(tourDateSchema).max(30, "30 dates maximum").default([]),
})

export type VitrineEditionInput = z.infer<typeof vitrineEditionSchema>

export const partnersSchema = z.object({
  partners: z
    .array(
      z.object({
        id: uuidSchema.nullish().transform((v) => v ?? null),
        name: z.string("Nom requis").trim().min(1, "Nom du partenaire requis").max(100),
        logo_url: imagePath.refine((v) => v !== "", "Logo requis"),
        url: optionalUrl,
        is_active: z.boolean().default(true),
      }),
    )
    .max(60, "60 partenaires maximum"),
})

export const importFinalistsSchema = z.object({
  edition: z.coerce.number("Édition invalide").int().min(2000).max(2100),
})
