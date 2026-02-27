import { Prisma } from "@prisma/client"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import type { SessionUser } from "@/lib/auth/auth-session-helpers"

type Filter = {
  siteId: string
  search?: string
  lowStock?: boolean
}

export async function queryGetStockItemsBySite(session: SessionUser, filterOrSiteId: string | Filter) {
  const filter: Filter = typeof filterOrSiteId === "string" ? { siteId: filterOrSiteId } : filterOrSiteId
  return withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    return tx.stockItem.findMany({
      where: {
        siteId: filter.siteId,
        ...(filter.search
          ? {
              OR: [
                { name: { contains: filter.search, mode: "insensitive" } },
                { reference: { contains: filter.search, mode: "insensitive" } },
              ],
            }
          : {}),
        // lowStock: quantityOnHand <= minimumLevel (only works for minimumLevel > 0)
        // We filter client-side after fetch since Prisma doesn't support column comparison in where
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        reference: true,
        name: true,
        unit: true,
        quantityOnHand: true,
        minimumLevel: true,
        unitCostCents: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  })
}

export type StockItemOption = Awaited<ReturnType<typeof queryGetStockItemsBySite>>[number]
export type StockListItem = Awaited<ReturnType<typeof queryGetStockItemsBySite>>[number]
