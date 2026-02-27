import { Prisma } from "@prisma/client"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import type { SessionUser } from "@/lib/auth/auth-session-helpers"

export async function queryGetStockItemDetail(session: SessionUser, stockItemId: string) {
  return withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    return tx.stockItem.findUnique({
      where: { id: stockItemId },
      include: {
        machine: { select: { id: true, name: true } },
        movements: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    })
  })
}

export type StockItemDetail = Awaited<ReturnType<typeof queryGetStockItemDetail>>
