import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db/prisma-client-singleton"
import { TENANT_SYSTEM_ROLES, getSystemRolePermissions } from "./system-roles-definitions"

type TxOrPrisma = Prisma.TransactionClient | typeof prisma

/**
 * Crée les 4 rôles système pour un nouveau tenant.
 * Accepte un client Prisma ou un TransactionClient.
 */
export async function createTenantSystemRoles(
  db: TxOrPrisma,
  tenantId: string
): Promise<void> {
  await db.tenantRole.createMany({
    data: TENANT_SYSTEM_ROLES.map(({ systemRole, name }) => ({
      tenantId,
      name,
      systemRole,
      permissions: getSystemRolePermissions(systemRole),
      isSystem: true,
    })),
    skipDuplicates: true,
  })
}
