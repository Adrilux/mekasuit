import { Prisma } from "@prisma/client"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import type { SessionUser } from "@/lib/auth/auth-session-helpers"

export type StockItemForPO = {
  id: string
  reference: string
  name: string
  unit: string
  supplierLinks: { supplierId: string; purchasePriceCents: number }[]
}

export async function queryGetStockItemsForPO(
  session: SessionUser,
  siteId: string,
): Promise<StockItemForPO[]> {
  return withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    return tx.stockItem.findMany({
      where: { tenantId: session.tenantId, siteId },
      select: {
        id: true,
        reference: true,
        name: true,
        unit: true,
        supplierLinks: { select: { supplierId: true, purchasePriceCents: true } },
      },
      orderBy: { name: "asc" },
    })
  })
}
