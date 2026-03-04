import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "./better-auth-server-config"
import { prisma } from "@/lib/db/prisma-client-singleton"
import { serverEnv } from "@/lib/env/env-server-schema"
import type { UserRole } from "@prisma/client"
import { ALL_ACTIONS } from "@/lib/permissions/permission-matrix"
import { getSystemRolePermissions } from "@/lib/permissions/system-roles-definitions"

export type SessionUser = {
  id: string           // authUserId Better Auth
  email: string
  name: string
  tenantId: string
  role: UserRole
  tenantRoleId: string | null   // ID du TenantRole actif
  permissions: string[]         // permissions effectives chargées depuis TenantRole
  siteIds: string[]    // sites auxquels l'utilisateur est assigné
  mustChangePassword: boolean
}

// Résout les permissions effectives d'un TenantUser :
// 1. Si le rôle est un rôle système (systemRole renseigné) → PERMISSION_MATRIX
// 2. Sinon → permissions stockées en DB sur TenantRole
// 3. Fallback role enum legacy si pas de tenantRole
function resolvePermissions(tenantUser: {
  role: UserRole
  tenantRoleId: string | null
  tenantRole: { id: string; permissions: string[]; systemRole: UserRole | null } | null
}): string[] {
  if (tenantUser.tenantRole) {
    if (tenantUser.tenantRole.systemRole) {
      return getSystemRolePermissions(tenantUser.tenantRole.systemRole)
    }
    return tenantUser.tenantRole.permissions
  }
  // Fallback legacy : utilise le champ role (enum) si pas de TenantRole assigné
  return getSystemRolePermissions(tenantUser.role)
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
      tenantRoleId: null,
      permissions: [...ALL_ACTIONS, "tenant:manage"],
      siteIds: [],
      mustChangePassword: false,
    }
  }

  // Récupère le profil tenant depuis notre DB
  const tenantUser = await prisma.tenantUser.findUnique({
    where: { authUserId: session.user.id },
    include: {
      userSites: { select: { siteId: true } },
      tenantRole: { select: { id: true, permissions: true, systemRole: true } },
    },
  })

  if (!tenantUser || !tenantUser.isActive) return null

  // Résolution des permissions effectives
  const permissions = resolvePermissions(tenantUser)

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
    tenantRoleId: tenantUser.tenantRoleId,
    permissions,
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
      tenantRoleId: null,
      permissions: [...ALL_ACTIONS, "tenant:manage"],
      siteIds: [],
      mustChangePassword: false,
    }
  }

  // Récupère le profil tenant depuis notre DB
  const tenantUser = await prisma.tenantUser.findUnique({
    where: { authUserId: authUser.id },
    include: {
      userSites: { select: { siteId: true } },
      tenantRole: { select: { id: true, permissions: true, systemRole: true } },
    },
  })

  // Authentifié mais pas encore lié à un tenant → onboarding
  if (!tenantUser || !tenantUser.isActive) {
    redirect("/onboarding")
  }

  // Résolution des permissions effectives
  const permissions = resolvePermissions(tenantUser)

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
    tenantRoleId: tenantUser.tenantRoleId,
    permissions,
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
