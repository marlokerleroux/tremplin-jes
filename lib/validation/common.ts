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

// Mots de passe parmi les plus utilisés (listes publiques de fuites, versions françaises comprises).
const COMMON_PASSWORDS = new Set([
  "12345678", "123456789", "1234567890", "12345678910", "87654321", "11111111", "00000000", "12341234", "11223344",
  "password", "password1", "password123", "motdepasse", "motdepasse1", "motdepasse123", "azertyuiop", "azerty123",
  "azertyui", "qwertyuiop", "qwerty123", "azerty12", "aaaaaaaa", "abcdefgh", "abcd1234", "abc12345", "iloveyou",
  "jetaime1", "doudou12", "soleil123", "bonjour1", "bonjour123", "loulou12", "marseille", "123456789a", "a1234567",
  "football", "sunshine", "princess", "baseball", "superman", "trustno1", "welcome1", "admin123", "administrateur",
  "tremplin", "tremplin1", "tremplin123", "jeunesenscene", "passmusique",
])

export const passwordSchema = z
  .string("Mot de passe requis")
  .min(8, "Le mot de passe doit contenir au moins 8 caractères")
  .max(128, "Le mot de passe est trop long (128 caractères maximum)")
  .refine(
    (value) => !COMMON_PASSWORDS.has(value.toLowerCase()) && !/^(.)\1+$/.test(value),
    "Ce mot de passe est trop courant, choisissez-en un autre",
  )

/** Chaîne optionnelle : "" et undefined deviennent null. */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Texte trop long (${max} caractères maximum)`)
    .nullish()
    .transform((value) => (value ? value : null))
