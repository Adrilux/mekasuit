import { Prisma } from "@prisma/client"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import type { SessionUser } from "@/lib/auth/auth-session-helpers"

export type InventorySessionListItem = {
  id: string
  status: "OPEN" | "CLOSED"
  createdAt: Date
  closedAt: Date | null
  itemCount: number
  countedCount: number
}

export async function queryGetInventorySessions(
  session: SessionUser,
  siteId: string,
): Promise<InventorySessionListItem[]> {
  return withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    const sessions = await tx.stockInventorySession.findMany({
      where: { tenantId: session.tenantId, siteId },
      select: {
        id: true,
        status: true,
        createdAt: true,
        closedAt: true,
        items: { select: { id: true, countedQuantity: true } },
      },
      orderBy: { createdAt: "desc" },
    })
    return sessions.map((s) => ({
      id: s.id,
      status: s.status,
      createdAt: s.createdAt,
      closedAt: s.closedAt,
      itemCount: s.items.length,
      countedCount: s.items.filter((i) => i.countedQuantity !== null).length,
    }))
  })
}
