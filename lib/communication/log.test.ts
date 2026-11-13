import { it, expect, vi, afterEach } from "vitest"
const rpc=vi.hoisted(()=>vi.fn())
vi.mock("./store",()=>({communicationRpc:rpc}))
import { recordQuestion } from "./log"
afterEach(()=>vi.restoreAllMocks())
it("records question, status, safe sources and masked contact details",async()=>{
  rpc.mockResolvedValue(true)
  await recordQuestion("Mon mail est test@example.com, comment m’inscrire ?",{answer:"Je ne sais pas.",answerStatus:"missing_information",sources:[{title:"Document externe anonyme",url:"document://private"}]})
  expect(rpc).toHaveBeenCalledWith("record",expect.objectContaining({question:expect.stringContaining("[adresse e-mail masquée]"),status:"unanswered",topic:"Inscriptions",sources:[{title:"Document externe anonyme"}]}))
})
it("records provider failures and does not break the chatbot if logging fails",async()=>{
  rpc.mockResolvedValue(true);await recordQuestion("Une question",null)
  expect(rpc).toHaveBeenLastCalledWith("record",expect.objectContaining({status:"error",answer:""}))
  rpc.mockRejectedValue(new Error("secret"));const log=vi.spyOn(console,"error").mockImplementation(()=>{})
  await expect(recordQuestion("private question",null)).resolves.toBeUndefined()
  expect(log).toHaveBeenCalledWith("[communication] question recording unavailable")
})
