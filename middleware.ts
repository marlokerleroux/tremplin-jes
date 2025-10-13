import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // Simply pass through all requests without auth checks
  // Auth is handled by individual pages using server components
  return
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
