import { Prisma } from "@prisma/client"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import type { SessionUser } from "@/lib/auth/auth-session-helpers"

export type InventoryItemRow = {
  id: string
  stockItemId: string
  reference: string
  name: string
  unit: string
  systemQuantity: number
  countedQuantity: number | null
  note: string | null
}

export type InventorySessionDetail = {
  id: string
  siteId: string
  status: "OPEN" | "CLOSED"
  createdAt: Date
  closedAt: Date | null
  items: InventoryItemRow[]
}

export async function queryGetInventorySessionDetail(
  session: SessionUser,
  sessionId: string,
): Promise<InventorySessionDetail | null> {
  return withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    const s = await tx.stockInventorySession.findFirst({
      where: { id: sessionId, tenantId: session.tenantId },
      select: {
        id: true,
        siteId: true,
        status: true,
        createdAt: true,
        closedAt: true,
        items: {
          select: {
            id: true,
            stockItemId: true,
            systemQuantity: true,
            countedQuantity: true,
            note: true,
            stockItem: { select: { reference: true, name: true, unit: true } },
          },
          orderBy: { stockItem: { reference: "asc" } },
        },
      },
    })
    if (!s) return null
    return {
      id: s.id,
      siteId: s.siteId,
      status: s.status,
      createdAt: s.createdAt,
      closedAt: s.closedAt,
      items: s.items.map((i) => ({
        id: i.id,
        stockItemId: i.stockItemId,
        reference: i.stockItem.reference,
        name: i.stockItem.name,
        unit: i.stockItem.unit,
        systemQuantity: i.systemQuantity,
        countedQuantity: i.countedQuantity,
        note: i.note,
      })),
    }
  })
}
