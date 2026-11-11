export const TOPICS = ["Inscriptions", "Éligibilité", "Auditions", "Technique", "Jury et résultats", "Finale", "Association", "Autres"] as const
export type Topic = typeof TOPICS[number]
export type QuestionStatus = "answered" | "unanswered" | "error"
export interface Question {
  id: string; question: string; answer: string; status: QuestionStatus; topic: Topic
  createdAt: string; sources: { title: string; url?: string }[]
  validatedAnswer: string | null; manualId: string | null; resolved: boolean
}
export interface Draft { id: string; title: string; body: string; format: string; status: "draft" | "ready" | "published"; questionIds: string[]; updatedAt: string }
export interface Dashboard {
  questions: Question[]; total: number; page: number; pageSize: number
  stats: { total: number; answered: number; unanswered: number; corrected: number; firstRecordedAt: string | null }
  topics: { topic: Topic; count: number; unanswered: number }[]
  days: { date: string; count: number; unanswered: number }[]
  recurring: { question: string; count: number; topic: Topic; questionId: string; answer: string | null }[]
  drafts: Draft[]
}
