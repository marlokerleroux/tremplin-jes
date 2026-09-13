import { prisma } from "@/lib/prisma"
import { getSiteUrl } from "@/lib/site-url"
import { getEmailLayout, type EmailTemplate } from "./templates"
import { renderTemplate, type TemplateVars } from "./template-engine"
import { EDITABLE_TEMPLATES, type EditableTemplateKey } from "./editable-templates"

export interface StoredTemplate {
  key: EditableTemplateKey
  subject: string
  body: string
  isCustomized: boolean
  updated_at: string | null
}

/** Modèle effectif : version personnalisée en base, sinon texte par défaut. */
export async function getTemplate(key: EditableTemplateKey): Promise<StoredTemplate> {
  const definition = EDITABLE_TEMPLATES[key]
  const stored = await prisma.emailTemplate.findUnique({ where: { key } }).catch((error) => {
    console.error("[email] template lookup failed, using default:", error)
    return null
  })
  if (!stored) {
    return { key, subject: definition.subject, body: definition.body, isCustomized: false, updated_at: null }
  }
  return { key, subject: stored.subject, body: stored.body, isCustomized: true, updated_at: stored.updated_at.toISOString() }
}

export async function listTemplates(): Promise<StoredTemplate[]> {
  const stored = await prisma.emailTemplate.findMany()
  const byKey = new Map(stored.map((t) => [t.key, t]))
  return (Object.keys(EDITABLE_TEMPLATES) as EditableTemplateKey[]).map((key) => {
    const custom = byKey.get(key)
    const definition = EDITABLE_TEMPLATES[key]
    return custom
      ? { key, subject: custom.subject, body: custom.body, isCustomized: true, updated_at: custom.updated_at.toISOString() }
      : { key, subject: definition.subject, body: definition.body, isCustomized: false, updated_at: null }
  })
}

/** Variables communes à tous les modèles pour un candidat donné. */
export function candidateVars(input: {
  firstName: string
  lastName: string
  stageName: string
  edition: number
  auditionDate?: string
  auditionTime?: string
  venue?: string
}): TemplateVars {
  return {
    prenom: input.firstName,
    nom: input.lastName,
    nom_scene: input.stageName,
    edition: input.edition,
    date_audition: input.auditionDate ?? "",
    heure_audition: input.auditionTime ?? "",
    lieu: input.venue ?? "",
    lien_espace: `${getSiteUrl()}/dashboard`,
  }
}

/** Rend un modèle (personnalisé ou par défaut) en email prêt à l'envoi. */
export function renderStoredTemplate(template: { subject: string; body: string }, vars: TemplateVars): EmailTemplate {
  const rendered = renderTemplate(template.subject, template.body, vars)
  return { subject: rendered.subject, text: rendered.text, html: getEmailLayout(rendered.html) }
}

export async function renderEmail(key: EditableTemplateKey, vars: TemplateVars): Promise<EmailTemplate> {
  return renderStoredTemplate(await getTemplate(key), vars)
}
