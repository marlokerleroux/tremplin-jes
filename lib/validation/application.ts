import { z } from "zod"
import { APPLICATION_STATUSES, APPLICATION_TYPES } from "@/lib/season"
import { isoDateSchema, optionalText } from "./common"

export const BIOGRAPHY_MIN_LENGTH = 100
export const MAX_GROUP_MEMBERS = 15

export const groupMemberSchema = z.object({
  firstName: z.string("Prénom requis").trim().max(100, "Prénom trop long"),
  lastName: z.string("Nom requis").trim().max(100, "Nom trop long"),
  birthDate: isoDateSchema,
})

export type GroupMember = z.infer<typeof groupMemberSchema>

const applicationBase = {
  stage_name: z.string("Nom de scène requis").trim().min(1, "Nom de scène requis").max(100, "Nom de scène trop long"),
  musical_style: z.string("Style musical requis").trim().min(1, "Style musical requis").max(100, "Style musical trop long"),
  biography: z
    .string("Biographie requise")
    .trim()
    .min(BIOGRAPHY_MIN_LENGTH, `La biographie doit contenir au moins ${BIOGRAPHY_MIN_LENGTH} caractères`)
    .max(5000, "La biographie est trop longue (5000 caractères maximum)"),
  instagram: optionalText(100),
  has_original_composition: z.boolean().default(false),
  is_sacem_registered: z.boolean().nullish().transform((v) => (v === undefined ? null : v)),
  has_stage_experience: z.boolean().default(false),
  stage_experience_details: optionalText(2000),
}

export const applicationCreateSchema = z
  .object({
    application_type: z.enum(APPLICATION_TYPES, "Type de candidature invalide"),
    group_members: z
      .array(groupMemberSchema, "Membres invalides")
      .min(1, "Renseignez au moins une date de naissance")
      .max(MAX_GROUP_MEMBERS, `${MAX_GROUP_MEMBERS} membres maximum`),
    how_did_you_hear: optionalText(200),
    allows_broadcast: z.boolean().default(false),
    preferred_audition_date: isoDateSchema.nullish().transform((v) => v ?? null),
    accepted_rules: z.literal(true, "Vous devez accepter le règlement du tremplin pour soumettre votre candidature"),
    ...applicationBase,
  })
  .superRefine((data, ctx) => {
    if (data.application_type === "solo" && data.group_members.length !== 1) {
      ctx.addIssue({ code: "custom", path: ["group_members"], message: "Une candidature solo ne comporte qu'une personne" })
    }
    if (data.application_type === "group") {
      if (data.group_members.length < 2) {
        ctx.addIssue({ code: "custom", path: ["group_members"], message: "Un groupe doit comporter au moins deux membres" })
      }
      data.group_members.forEach((member, index) => {
        if (!member.firstName || !member.lastName) {
          ctx.addIssue({
            code: "custom",
            path: ["group_members", index],
            message: `Renseignez le prénom et le nom du membre ${index + 1}`,
          })
        }
      })
    }
    if (data.has_stage_experience && !data.stage_experience_details) {
      ctx.addIssue({
        code: "custom",
        path: ["stage_experience_details"],
        message: "Décrivez vos expériences scéniques",
      })
    }
  })

export type ApplicationCreateInput = z.infer<typeof applicationCreateSchema>

/** Édition par un administrateur : mêmes contraintes de forme, sans le règlement ni la biographie minimale. */
export const applicationUpdateSchema = z.object({
  applicationId: z.uuid("Identifiant de candidature invalide"),
  updates: z.object({
    ...applicationBase,
    biography: z.string("Biographie requise").trim().min(1, "Biographie requise").max(5000, "Biographie trop longue"),
    group_members: z.array(groupMemberSchema).min(1, "Au moins un membre").max(MAX_GROUP_MEMBERS),
  }),
})

export const applicationStatusSchema = z.object({
  applicationId: z.uuid("Identifiant de candidature invalide"),
  status: z.enum(APPLICATION_STATUSES, "Statut invalide"),
})
