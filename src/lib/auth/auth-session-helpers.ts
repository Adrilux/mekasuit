import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "./better-auth-server-config"
import { prisma } from "@/lib/db/prisma-client-singleton"
import { serverEnv } from "@/lib/env/env-server-schema"
import type { UserRole } from "@prisma/client"

export type SessionUser = {
  id: string           // authUserId Better Auth
  email: string
  name: string
  tenantId: string
  role: UserRole
  siteIds: string[]    // sites auxquels l'utilisateur est assigné
  mustChangePassword: boolean
}

// Récupère la session courante avec les données tenant enrichies
// Retourne null si non authentifié
export async function getSession(): Promise<SessionUser | null> {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) return null

  // Super admin identifié par email — session synthétique sans tenant
  if (session.user.email === serverEnv.SUPER_ADMIN_EMAIL) {
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      tenantId: "",
      role: "super_admin",
      siteIds: [],
      mustChangePassword: false,
    }
  }

  // Récupère le profil tenant depuis notre DB
  const tenantUser = await prisma.tenantUser.findUnique({
    where: { authUserId: session.user.id },
    include: {
      userSites: { select: { siteId: true } },
    },
  })

  if (!tenantUser || !tenantUser.isActive) return null

  // Récupère le flag mustChangePassword depuis la table user Better Auth
  const users = await prisma.$queryRaw<{ mustChangePassword: boolean }[]>`
    SELECT "mustChangePassword" FROM "user" WHERE id = ${session.user.id} LIMIT 1
  `
  const mustChangePassword = users[0]?.mustChangePassword ?? false

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    tenantId: tenantUser.tenantId,
    role: tenantUser.role,
    siteIds: tenantUser.userSites.map((us: { siteId: string }) => us.siteId),
    mustChangePassword,
  }
}

// Récupère l'utilisateur Better Auth brut sans vérifier le tenant
// Utilisé pour distinguer "non authentifié" de "authentifié sans tenant"
async function getAuthSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user ?? null
}

// Comme getSession() mais redirige vers /login si non authentifié
// Redirige vers /onboarding si authentifié mais pas encore lié à un tenant
// Redirige vers /change-password si mustChangePassword est vrai
// À utiliser dans les Server Components protégés
export async function requireSession(): Promise<SessionUser> {
  const authUser = await getAuthSession()

  // Pas du tout authentifié → page de login
  if (!authUser) {
    redirect("/login")
  }

  // Super admin identifié par email — bypass tenant check
  if (authUser.email === serverEnv.SUPER_ADMIN_EMAIL) {
    return {
      id: authUser.id,
      email: authUser.email,
      name: authUser.name,
      tenantId: "",
      role: "super_admin",
      siteIds: [],
      mustChangePassword: false,
    }
  }

  // Récupère le profil tenant depuis notre DB
  const tenantUser = await prisma.tenantUser.findUnique({
    where: { authUserId: authUser.id },
    include: {
      userSites: { select: { siteId: true } },
    },
  })

  // Authentifié mais pas encore lié à un tenant → onboarding
  if (!tenantUser || !tenantUser.isActive) {
    redirect("/onboarding")
  }

  // Récupère le flag mustChangePassword
  const users = await prisma.$queryRaw<{ mustChangePassword: boolean }[]>`
    SELECT "mustChangePassword" FROM "user" WHERE id = ${authUser.id} LIMIT 1
  `
  const mustChangePassword = users[0]?.mustChangePassword ?? false

  return {
    id: authUser.id,
    email: authUser.email,
    name: authUser.name,
    tenantId: tenantUser.tenantId,
    role: tenantUser.role,
    siteIds: tenantUser.userSites.map((us: { siteId: string }) => us.siteId),
    mustChangePassword,
  }
}

// Vérifie que l'utilisateur a bien le rôle super_admin
// Redirige vers /dashboard sinon
export async function requireSuperAdmin(): Promise<SessionUser> {
  const session = await requireSession()

  if (session.role !== "super_admin") {
    redirect("/dashboard")
  }

  return session
}
