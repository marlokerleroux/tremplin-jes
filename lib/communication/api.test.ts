import { beforeEach, afterEach, describe, it, expect, vi } from "vitest"
import { scryptSync } from "node:crypto"
const mocks=vi.hoisted(()=>({rpc:vi.fn(),embed:vi.fn(),provider:vi.fn(),clear:vi.fn()}))
vi.mock("./store",()=>({communicationRpc:mocks.rpc}))
vi.mock("../../chatbot/server/provider.mjs",()=>({embed:mocks.embed,openrouter:mocks.provider}))
vi.mock("../../chatbot/server/config.mjs",()=>({config:{model:"test-model",embedding:"test-embedding"}}))
vi.mock("@/lib/chatbot/knowledge",()=>({clearKnowledgeCache:mocks.clear}))
import { handleCommunication } from "./api"
import { issueSession, ADMIN_COOKIE } from "./session"
const salt="b".repeat(32),hash=`scrypt:${salt}:${scryptSync("test-password",salt,32).toString("hex")}`
const id="00000000-0000-4000-8000-000000000001"
function req(action:string,method="GET",body?:unknown,authorized=true,origin="https://tremplin.example"){
  return new Request(`https://tremplin.example/api/communication/${action}`,{method,headers:{origin,"content-type":"application/json",...(authorized?{cookie:`${ADMIN_COOKIE}=${issueSession(hash)}`}:{})},...(body&&method!=="GET"?{body:JSON.stringify(body)}:{})})
}
beforeEach(()=>{vi.stubEnv("AUTH_SECRET","test-only-secret");vi.stubEnv("CHATBOT_ADMIN_PASSWORD_HASH",hash);vi.clearAllMocks();mocks.rpc.mockResolvedValue(true);mocks.embed.mockResolvedValue([Array(1536).fill(.1)])})
afterEach(()=>vi.unstubAllEnvs())
describe("communication API boundary",()=>{
  it.each(["data","answer","draft","generate","export"])("requires a session for %s",async action=>{
    const response=await handleCommunication(req(action,action==="data"||action==="export"?"GET":"POST",{},false),action)
    expect(response.status).toBe(401);expect(mocks.rpc).not.toHaveBeenCalled()
  })
  it("rejects cross-origin changes and excessive login attempts",async()=>{
    expect((await handleCommunication(req("answer","POST",{},true,"https://attacker.example"),"answer")).status).toBe(403)
    mocks.rpc.mockResolvedValue(false)
    expect((await handleCommunication(req("session","POST",{password:"test-password"},false),"session")).status).toBe(429)
  })
  it("logs in with the password without returning the hash",async()=>{
    const r=await handleCommunication(req("session","POST",{password:"test-password"},false),"session")
    expect(r.status).toBe(200);expect(r.headers.get("set-cookie")).toContain("HttpOnly")
    expect(await r.text()).not.toContain(hash)
    expect((await handleCommunication(req("session","POST",{password:"wrong"},false),"session")).status).toBe(401)
  })
  it("fails closed if the login quota store is unavailable",async()=>{
    mocks.rpc.mockRejectedValue(new Error("private-secret"))
    const r=await handleCommunication(req("session","POST",{password:"test-password"},false),"session")
    expect(r.status).toBe(503);expect(r.headers.get("set-cookie")).toBeNull();expect(await r.text()).not.toContain("private-secret")
  })
  it("does not publish a manual answer when embedding fails",async()=>{
    mocks.rpc.mockImplementation(async(action:string)=>action==="question"?{id,question:"Comment participer ?"}:true)
    mocks.embed.mockRejectedValue(new Error("provider unavailable"))
    expect((await handleCommunication(req("answer","POST",{questionId:id,answer:"Une réponse vérifiée."}),"answer")).status).toBe(503)
    expect(mocks.rpc.mock.calls.some(([action])=>action==="answer")).toBe(false)
  })
  it("adds a validated answer to knowledge and clears the cache",async()=>{
    mocks.rpc.mockImplementation(async(action:string)=>action==="question"?{id,question:"Comment participer ?"}:action==="answer"?{id}:true)
    expect((await handleCommunication(req("answer","POST",{questionId:id,answer:"Utilise le dossier en ligne."}),"answer")).status).toBe(200)
    expect(mocks.rpc).toHaveBeenCalledWith("answer",expect.objectContaining({questionId:id,answer:"Utilise le dossier en ligne.",embeddingModel:"test-embedding"}))
    expect(mocks.clear).toHaveBeenCalled()
  })
  it("requires an answer before drafting a post",async()=>{
    mocks.rpc.mockResolvedValue({id,status:"unanswered",validatedAnswer:null,answer:"Je ne sais pas."})
    expect((await handleCommunication(req("generate","POST",{questionId:id,format:"Instagram"}),"generate")).status).toBe(409)
    expect(mocks.provider).not.toHaveBeenCalled()
  })
  it("generates a private editable draft from the validated answer",async()=>{
    mocks.rpc.mockImplementation(async(action:string)=>action==="question"?{id,status:"unanswered",question:"lucas@example.com : comment participer ?",validatedAnswer:"Le dossier se remplit en ligne."}:true)
    mocks.provider.mockResolvedValue({choices:[{message:{content:JSON.stringify({title:"Participer au Tremplin",body:"Prépare ton dossier en ligne."})}}]})
    const r=await handleCommunication(req("generate","POST",{questionId:id,format:"Instagram"}),"generate")
    expect(r.status).toBe(200);expect(await r.json()).toMatchObject({status:"draft",questionIds:[id]})
    expect(JSON.stringify(mocks.provider.mock.calls)).not.toContain("lucas@example.com")
    expect(mocks.rpc).toHaveBeenCalledWith("save_draft",expect.objectContaining({status:"draft"}))
  })
})
