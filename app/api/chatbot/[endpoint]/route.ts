import { handleGet, handlePost } from "@/lib/chatbot/handler"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

type Context = { params: Promise<{ endpoint: string }> }
export async function GET(_request: Request, context: Context) {
  return handleGet((await context.params).endpoint)
}
export async function POST(request: Request, context: Context) {
  return handlePost(request, (await context.params).endpoint)
}
