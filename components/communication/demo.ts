import type { Dashboard, Question } from "@/lib/communication/types"

/** Fictional, deliberately marked examples. Never stored or sent to the chatbot. */
export function demoDashboard(): Dashboard {
  const examples: [string, Question["topic"], string][] = [
    ["Comment s’inscrire au Tremplin ?", "Inscriptions", "Le dossier d’inscription se remplit depuis l’espace candidat du site. Prépare les informations de ton projet musical avant de commencer."],
    ["Peut-on modifier notre dossier après l’envoi ?", "Inscriptions", ""],
    ["Quel matériel faut-il apporter aux auditions ?", "Technique", "Consulte les informations techniques de ta convocation pour préparer ton passage."],
    ["Comment s’inscrire au Tremplin ?", "Inscriptions", "Le dossier d’inscription se remplit depuis l’espace candidat du site."],
    ["Nos proches peuvent-ils assister aux auditions ?", "Auditions", ""],
    ["Qui compose le jury ?", "Jury et résultats", "Le jury réunit des personnes issues du monde musical."],
    ["Comment s’inscrire au Tremplin ?", "Inscriptions", "Le dossier se remplit depuis l’espace candidat du site."],
    ["Comment contacter l’association ?", "Association", "Retrouve les coordonnées de l’équipe sur le site du Tremplin."],
    ["Quel matériel faut-il apporter aux auditions ?", "Technique", "Consulte les informations techniques de ta convocation pour préparer ton passage."],
    ["Est-ce qu’un duo peut participer ?", "Éligibilité", ""],
    ["Où retrouver les résultats ?", "Jury et résultats", "Les informations sont disponibles sur le site du Tremplin."],
    ["Comment s’inscrire au Tremplin ?", "Inscriptions", "Le dossier se remplit depuis l’espace candidat du site."],
  ]
  const questions: Question[] = examples.map(([question, topic, answer], i) => ({ id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`, question, topic, answer, status: answer ? "answered" : "unanswered", createdAt: new Date(Date.now() - (i * 17 + 1) * 3600000).toISOString(), sources: answer ? [{ title: "Site du Tremplin" }] : [], validatedAnswer: null, manualId: null, resolved: false }))
  const topics = [...new Set(questions.map(q => q.topic))].map(topic => ({ topic, count: questions.filter(q => q.topic === topic).length, unanswered: questions.filter(q => q.topic === topic && !q.answer).length })).sort((a,b)=>b.count-a.count)
  const days = [...new Set(questions.map(q=>q.createdAt.slice(0,10)))].sort().map(date=>({date,count:questions.filter(q=>q.createdAt.startsWith(date)).length,unanswered:questions.filter(q=>q.createdAt.startsWith(date)&&!q.answer).length}))
  const recurring = [...new Set(questions.map(q=>q.question))].map(question=>{const q=questions.find(q=>q.question===question)!;return {question,count:questions.filter(q=>q.question===question).length,topic:q.topic,questionId:q.id,answer:q.answer||null}}).sort((a,b)=>b.count-a.count)
  return {questions,total:questions.length,page:0,pageSize:25,stats:{total:12,answered:9,unanswered:3,corrected:0,firstRecordedAt:questions.at(-1)!.createdAt},topics,days,recurring,drafts:[{id:"00000000-0000-4000-8000-000000000099",title:"Exemple · Préparer son dossier",body:"Un projet musical à partager ? Prépare tes informations avant de commencer ton dossier en ligne. Retrouve les informations du Tremplin sur le site.\n\nCeci est un exemple fictif pour découvrir l’éditeur.",format:"Instagram",status:"draft",questionIds:[questions[0].id],updatedAt:new Date().toISOString()}]}
}
