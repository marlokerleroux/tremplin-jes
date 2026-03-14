import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"

const VITRINE_HOSTNAMES = [
  "tremplin-jeunes-en-scene.fr",
  "www.tremplin-jeunes-en-scene.fr",
]

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host")?.split(":")[0] ?? ""
  const pathname = request.nextUrl.pathname

  const isVitrineHost = VITRINE_HOSTNAMES.includes(hostname)

  // Vitrine hostname: rewrite root to /vitrine
  if (isVitrineHost) {
    if (pathname === "/") {
      const url = request.nextUrl.clone()
      url.pathname = "/vitrine"
      return NextResponse.rewrite(url)
    }
    // Let other paths pass through (e.g. /legal, /privacy)
    return NextResponse.next()
  }

  // Candidat hostname (or localhost): apply NextAuth middleware
  return (auth as any)(request)
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|pdf)$).*)"],
}
