import { afterEach, beforeEach, it, expect, vi } from "vitest"
const mocks=vi.hoisted(()=>({rpc:vi.fn(),db:vi.fn()}))
vi.mock("./store",()=>({communicationRpc:mocks.rpc}))
vi.mock("@/lib/prisma",()=>({prisma:{$queryRaw:mocks.db}}))
import { readKnowledge, clearKnowledgeCache } from "@/lib/chatbot/knowledge"
beforeEach(()=>{
  vi.stubEnv("SUPABASE_URL","");vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY","");clearKnowledgeCache();vi.clearAllMocks()
  mocks.db.mockResolvedValue([{value:{chunks:[{id:"site",url:"https://example.com",text:"Site",title:"Site",embedding:null}],lexical:[{id:"site"}],embeddingModel:"model",stats:{documents:1}}}])
})
afterEach(()=>vi.unstubAllEnvs())
it("includes compatible active manual answers and invalidates its cache after a correction",async()=>{
  mocks.rpc.mockResolvedValue([{id:"manual",title:"Réponse validée par l’équipe",text:"Réponse",url:"document://tremplin/reponse-1",embedding_model:"model",lexical:true},{id:"incompatible",embedding_model:"old",lexical:true}])
  const first=await readKnowledge(["duo"]);expect(first.chunks.map(c=>c.id)).toEqual(["site","manual","incompatible"]);expect(first.lexical[0].id).toBe("manual");expect(first.chunks[2].embedding).toBeNull()
  await readKnowledge(["duo"]);expect(mocks.rpc).toHaveBeenCalledTimes(1)
  clearKnowledgeCache();await readKnowledge(["duo"]);expect(mocks.rpc).toHaveBeenCalledTimes(2)
})
it("preserves the existing corpus while the additive migration is not installed",async()=>{
  mocks.rpc.mockRejectedValue(new Error("missing function"))
  expect((await readKnowledge()).chunks[0].id).toBe("site")
})
