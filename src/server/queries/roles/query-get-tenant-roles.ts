import { prisma } from "@/lib/db/prisma-client-singleton"
import { getSystemRolePermissions } from "@/lib/permissions/system-roles-definitions"

export type TenantRoleItem = {
  id: string
  name: string
  permissions: string[]
  isSystem: boolean
  systemRole: string | null
  _count: { tenantUsers: number }
}

export async function queryGetTenantRoles(tenantId: string): Promise<TenantRoleItem[]> {
  const roles = await prisma.tenantRole.findMany({
    where: { tenantId },
    include: { _count: { select: { tenantUsers: true } } },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
  })

  // Pour les rôles système, les permissions viennent toujours de PERMISSION_MATRIX
  // (la colonne permissions en DB peut être désynchronisée)
  return roles.map((role) => ({
    ...role,
    permissions: role.systemRole
      ? getSystemRolePermissions(role.systemRole)
      : role.permissions,
  }))
}
