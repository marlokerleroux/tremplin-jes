import { handleCommunication } from "@/lib/communication/api"
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60
async function route(request: Request, context: { params: Promise<{action:string}> }) { return handleCommunication(request,(await context.params).action) }
export { route as GET, route as POST, route as DELETE }
