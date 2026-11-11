import { TOPICS, type Topic, type QuestionStatus } from "./types"
export function redactContacts(text: string): string {
  return text.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[adresse e-mail masquée]")
    .replace(/(?:\+33\s?[1-9]|0[1-9])(?:[ .-]?\d{2}){4}\b/g, "[téléphone masqué]")
}
export function classifyTopic(text: string): Topic {
  const value = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  const rules: [Topic, RegExp][] = [
    ["Éligibilité", /\bage\b|\bans\b|eligible|habite|bretagne|departement|moyenne|professionnel|amateur/],
    ["Technique", /materiel|batterie|ampli|micro|usb|wav|mp3|fiche technique|piano|balance|cable|bande.son|morceau/],
    ["Jury et résultats", /jury|jure|note|resultat|selection|evaluation/],
    ["Finale", /finale|vauban|preprod|festival|tournee|billet|gagn|invitation/],
    ["Inscriptions", /inscri|candidat|dossier|compte|autorisation|document|modifier/],
    ["Auditions", /audition|convocation|horaire|parking|tram|accompagn|echauff|handicap|retard/],
    ["Association", /association|contact|benevole|pass.musique|qui etes/],
  ]
  return rules.find(([, rule]) => rule.test(value))?.[0] || "Autres"
}
export function responseStatus(answer: string, explicit?: string): QuestionStatus {
  if (explicit === "missing_information" || /je n['’]ai pas (?:cette|d['’])information|je ne (?:sais|dispose|peux pas confirmer)|information (?:n['’]est pas|absente)|reste à confirmer|n['’]est pas (?:encore )?(?:précisé|publié|confirmé)/i.test(answer)) return "unanswered"
  return "answered"
}
export function validTopic(topic: unknown): topic is Topic { return TOPICS.includes(topic as Topic) }
export function safeCsv(value: unknown): string {
  let text = String(value ?? "")
  if (/^[\s]*[=+\-@\t\r]/.test(text)) text = "'" + text
  return '"' + text.replaceAll('"', '""') + '"'
}
export function validUuid(value: unknown): value is string { return typeof value === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value) }
