import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import NextAuth from "next-auth"
import { authConfigEdge } from "@/lib/auth-config.edge"
import { isVitrineHost as matchesVitrineHost } from "@/lib/vitrine/host"

const { auth } = NextAuth(authConfigEdge)

const VITRINE_PAGES = ["/a-propos"]
const VITRINE_ALLOWED_PATHS = ["/legal", "/privacy"]

function matchesPath(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host")?.split(":")[0] ?? ""
  const pathname = request.nextUrl.pathname

  // Static, isolated widget: let its HTML, JS, CSS and fonts through.
  if (matchesPath(pathname, ["/chatbot"])) return NextResponse.next()

  const isVitrineHost = matchesVitrineHost(hostname, process.env.LOCAL_SITE_MODE)

  // Vitrine hostname: rewrite root to /vitrine, block app routes
  if (isVitrineHost) {
    if (pathname === "/admin") {
      const url = request.nextUrl.clone()
      url.pathname = "/communication"
      return NextResponse.rewrite(url)
    }
    if (pathname === "/") {
      const url = request.nextUrl.clone()
      url.pathname = "/vitrine"
      return NextResponse.rewrite(url)
    }
    // Redirect /vitrine to / to avoid duplicate content
    if (matchesPath(pathname, ["/vitrine"])) {
      return NextResponse.redirect(new URL("/", request.url))
    }
    // Rewrite vitrine sub-pages (e.g. /a-propos -> /vitrine/a-propos)
    if (matchesPath(pathname, VITRINE_PAGES)) {
      const url = request.nextUrl.clone()
      url.pathname = `/vitrine${pathname}`
      return NextResponse.rewrite(url)
    }
    // Allow only public pages (legal, privacy)
    if (matchesPath(pathname, VITRINE_ALLOWED_PATHS)) {
      return NextResponse.next()
    }
    // Block app routes on vitrine domain
    return NextResponse.redirect(new URL("/", request.url))
  }

  // Candidat hostname (or localhost): block /vitrine route, apply NextAuth (callbacks.authorized)
  if (matchesPath(pathname, ["/vitrine"])) {
    return NextResponse.redirect(new URL("/", request.url))
  }
  return (auth as unknown as (req: NextRequest) => Promise<Response>)(request)
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|pdf)$).*)"],
}
