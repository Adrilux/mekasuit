import { prisma } from "@/lib/db/prisma-client-singleton"

export async function queryGetAllTenants() {
  return prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      license: true,
      modules: { orderBy: { module: "asc" } },
      _count: {
        select: {
          sites: true,
          tenantUsers: { where: { isActive: true } },
        },
      },
    },
  })
}

export type TenantWithDetails = Awaited<ReturnType<typeof queryGetAllTenants>>[number]
