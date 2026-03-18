import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import NextAuth from "next-auth"
import { authConfigEdge } from "@/lib/auth-config.edge"

const { auth } = NextAuth(authConfigEdge)

const VITRINE_HOSTNAMES = [
  "tremplin-jeunes-en-scene.fr",
  "www.tremplin-jeunes-en-scene.fr",
]

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host")?.split(":")[0] ?? ""
  const pathname = request.nextUrl.pathname

  const isVitrineHost = VITRINE_HOSTNAMES.includes(hostname)

  // Vitrine hostname: rewrite root to /vitrine, block app routes
  if (isVitrineHost) {
    if (pathname === "/") {
      const url = request.nextUrl.clone()
      url.pathname = "/vitrine"
      return NextResponse.rewrite(url)
    }
    // Redirect /vitrine to / to avoid duplicate content
    if (pathname.startsWith("/vitrine")) {
      return NextResponse.redirect(new URL("/", request.url))
    }
    // Rewrite vitrine sub-pages (e.g. /a-propos -> /vitrine/a-propos)
    const vitrinePages = ["/a-propos"]
    if (vitrinePages.some((p) => pathname.startsWith(p))) {
      const url = request.nextUrl.clone()
      url.pathname = `/vitrine${pathname}`
      return NextResponse.rewrite(url)
    }
    // Allow only public pages (legal, privacy)
    const allowedPaths = ["/legal", "/privacy"]
    if (allowedPaths.some((p) => pathname.startsWith(p))) {
      return NextResponse.next()
    }
    // Block app routes on vitrine domain
    return NextResponse.redirect(new URL("/", request.url))
  }

  // Candidat hostname (or localhost): block /vitrine route, apply NextAuth
  if (pathname.startsWith("/vitrine")) {
    return NextResponse.redirect(new URL("/", request.url))
  }
  return (auth as any)(request)
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|pdf)$).*)"],
}
