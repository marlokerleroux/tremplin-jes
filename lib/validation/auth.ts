import { z } from "zod"
import { emailSchema, optionalText, passwordSchema } from "./common"

export const BRITTANY_POSTAL_PREFIXES = ["22", "29", "35", "56"] as const

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string("Prénom requis").trim().min(1, "Prénom requis").max(100, "Prénom trop long"),
  lastName: z.string("Nom requis").trim().min(1, "Nom requis").max(100, "Nom trop long"),
  streetAddress: z.string("Adresse requise").trim().min(1, "Adresse requise").max(200, "Adresse trop longue"),
  city: z.string("Ville requise").trim().min(1, "Ville requise").max(100, "Ville trop longue"),
  postalCode: z
    .string("Code postal requis")
    .trim()
    .regex(/^\d{5}$/, "Code postal invalide (5 chiffres)")
    .refine(
      (value) => BRITTANY_POSTAL_PREFIXES.includes(value.slice(0, 2) as (typeof BRITTANY_POSTAL_PREFIXES)[number]),
      "L'inscription au Tremplin Jeunes en Scène est réservée aux résidents bretons (codes postaux : 22, 29, 35, 56)",
    ),
  phone: z
    .string("Téléphone requis")
    .trim()
    .regex(/^\+?[0-9 .()-]{8,20}$/, "Numéro de téléphone invalide"),
  acceptedPrivacyPolicy: z.literal(true, "Vous devez accepter la politique de confidentialité"),
})

export type SignupInput = z.infer<typeof signupSchema>

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export const resetPasswordSchema = z.object({
  token: z.string("Jeton requis").regex(/^[a-f0-9]{64}$/, "Lien de réinitialisation invalide"),
  password: passwordSchema,
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
})

// Réexporté pour d'éventuels formulaires de profil.
export const optionalPhone = optionalText(20)
