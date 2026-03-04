import { prisma } from "@/lib/db/prisma-client-singleton"
import { getSystemRolePermissions } from "@/lib/permissions/system-roles-definitions"
import type { UserRole } from "@prisma/client"

// Mapping nom FR → UserRole pour fallback quand systemRole n'est pas encore renseigné en DB
const NAME_TO_SYSTEM_ROLE: Record<string, UserRole> = {
  "administrateur":      "client_admin",
  "responsable atelier": "workshop_manager",
  "technicien":          "technician",
  "lecteur":             "reader",
}

export type RoleUser = {
  authUserId: string
  name: string
  email: string
  jobTitle: string | null
}

export type TenantRoleItem = {
  id: string
  name: string
  permissions: string[]
  isSystem: boolean
  systemRole: string | null
  users: RoleUser[]
  _count: { tenantUsers: number }
}

export async function queryGetTenantRoles(tenantId: string): Promise<TenantRoleItem[]> {
  const roles = await prisma.tenantRole.findMany({
    where: { tenantId },
    include: {
      _count: { select: { tenantUsers: true } },
      tenantUsers: {
        where: { isActive: true },
        select: { authUserId: true, jobTitle: true },
      },
    },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
  })

  // Résoudre les noms/emails depuis Better Auth pour tous les users
  const allAuthIds = roles.flatMap((r) => r.tenantUsers.map((u) => u.authUserId))
  const authUsers = allAuthIds.length > 0
    ? await prisma.$queryRaw<{ id: string; name: string; email: string }[]>`
        SELECT id, name, email FROM "user" WHERE id = ANY(${allAuthIds}::text[])
      `
    : []
  const authMap = Object.fromEntries(authUsers.map((u) => [u.id, u]))

  return roles.map((role) => {
    // Résolution des permissions : systemRole en DB > fallback nom > permissions DB
    const resolvedSystemRole = (role.systemRole
      ?? NAME_TO_SYSTEM_ROLE[role.name.toLowerCase().trim()]
      ?? null) as UserRole | null

    const permissions = resolvedSystemRole
      ? getSystemRolePermissions(resolvedSystemRole)
      : role.permissions

    const users: RoleUser[] = role.tenantUsers.map((u) => ({
      authUserId: u.authUserId,
      name: authMap[u.authUserId]?.name ?? "—",
      email: authMap[u.authUserId]?.email ?? "",
      jobTitle: u.jobTitle ?? null,
    }))

    return {
      id: role.id,
      name: role.name,
      permissions,
      isSystem: role.isSystem,
      systemRole: resolvedSystemRole,
      users,
      _count: role._count,
    }
  })
}
