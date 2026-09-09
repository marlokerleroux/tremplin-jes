import { z } from "zod"
import { isHHMM, isIsoDate } from "@/lib/season"

// Messages par défaut en français (les messages explicites des schémas restent prioritaires).
z.config(z.locales.fr())

/** Retourne le premier message d'erreur, destiné à l'affichage utilisateur (sans nom de champ technique). */
export function formatZodError(error: z.ZodError): string {
  const issue = error.issues[0]
  return issue?.message || "Données invalides"
}

export const isoDateSchema = z
  .string("Date invalide")
  .trim()
  .refine(isIsoDate, "Date invalide (format attendu : AAAA-MM-JJ)")

export const hhmmSchema = z.string("Heure invalide").trim().refine(isHHMM, "Heure invalide (format attendu : HH:MM)")

export const emailSchema = z
  .string("Adresse email requise")
  .trim()
  .toLowerCase()
  .max(254, "Adresse email trop longue")
  .pipe(z.email("Adresse email invalide"))

export const uuidSchema = z.uuid("Identifiant invalide")

export const passwordSchema = z
  .string("Mot de passe requis")
  .min(8, "Le mot de passe doit contenir au moins 8 caractères")
  .max(128, "Le mot de passe est trop long (128 caractères maximum)")

/** Chaîne optionnelle : "" et undefined deviennent null. */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Texte trop long (${max} caractères maximum)`)
    .nullish()
    .transform((value) => (value ? value : null))
