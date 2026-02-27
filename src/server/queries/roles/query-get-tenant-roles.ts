import { prisma } from "@/lib/db/prisma-client-singleton"

export type TenantRoleItem = {
  id: string
  name: string
  permissions: string[]
  isSystem: boolean
  _count: { tenantUsers: number }
}

export async function queryGetTenantRoles(tenantId: string): Promise<TenantRoleItem[]> {
  return prisma.tenantRole.findMany({
    where: { tenantId },
    include: { _count: { select: { tenantUsers: true } } },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
  })
}
