import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/better-auth-server-config"

// Middleware Next.js — première ligne de défense
// Gère : session, protection des routes, injection du tenantId dans les headers

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Routes publiques — pas de vérification de session
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/offline") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/m/") ||   // QR code scan — public
    pathname === "/manifest.json" ||
    pathname === "/sw.js"

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Vérification de la session Better Auth
  const session = await auth.api.getSession({ headers: request.headers })

  // Redirige vers /login si non authentifié
  if (!session?.user) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Protection des routes admin et super-admin
  // La vérification du rôle exact se fait côté serveur dans les layouts/pages
  if (pathname.startsWith("/admin") || pathname.startsWith("/super-admin")) {
    // L'utilisateur est authentifié (vérifié ci-dessus)
    // Le rôle super_admin est vérifié dans le layout via requireSuperAdmin()
  }

  // Injecte le tenantId dans les headers pour les Server Components
  const response = NextResponse.next()

  if (session.user.id) {
    response.headers.set("x-auth-user-id", session.user.id)
  }

  return response
}

export const config = {
  // Applique le middleware à toutes les routes sauf les assets statiques
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
