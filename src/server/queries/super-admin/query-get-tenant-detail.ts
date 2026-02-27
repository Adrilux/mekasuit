import { prisma } from "@/lib/db/prisma-client-singleton"

export async function queryGetTenantDetail(tenantId: string) {
  return prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      license: true,
      modules: { orderBy: { module: "asc" } },
      sites: {
        orderBy: { createdAt: "asc" },
        include: {
          _count: {
            select: {
              machines: true,
              stockItems: true,
              interventions: true,
            },
          },
        },
      },
      tenantUsers: {
        where: { isActive: true },
        orderBy: { joinedAt: "asc" },
      },
    },
  })
}

export type TenantDetail = NonNullable<Awaited<ReturnType<typeof queryGetTenantDetail>>>
