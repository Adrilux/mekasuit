import { Prisma } from "@prisma/client"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import type { SessionUser } from "@/lib/auth/auth-session-helpers"

export async function queryGetMachineCategories(session: SessionUser, siteId: string): Promise<string[]> {
  return withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    const rows = await tx.machine.findMany({
      where: { siteId, category: { not: null } },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    })
    return rows.map((r) => r.category as string)
  })
}
