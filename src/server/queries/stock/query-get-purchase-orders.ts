import { Prisma } from "@prisma/client"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import type { SessionUser } from "@/lib/auth/auth-session-helpers"

export type PurchaseOrderListItem = {
  id: string
  status: "DRAFT" | "ORDERED" | "RECEIVED" | "CANCELLED"
  createdAt: Date
  approvedAt: Date | null
  receivedAt: Date | null
  supplierName: string
  itemCount: number
  totalQuantityOrdered: number
}

export async function queryGetPurchaseOrders(
  session: SessionUser,
  siteId: string,
): Promise<PurchaseOrderListItem[]> {
  return withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    const orders = await tx.purchaseOrder.findMany({
      where: { tenantId: session.tenantId, siteId },
      select: {
        id: true,
        status: true,
        createdAt: true,
        approvedAt: true,
        receivedAt: true,
        supplier: { select: { name: true } },
        items: { select: { quantityOrdered: true } },
      },
      orderBy: { createdAt: "desc" },
    })
    return orders.map((o) => ({
      id: o.id,
      status: o.status,
      createdAt: o.createdAt,
      approvedAt: o.approvedAt,
      receivedAt: o.receivedAt,
      supplierName: o.supplier.name,
      itemCount: o.items.length,
      totalQuantityOrdered: o.items.reduce((sum, i) => sum + i.quantityOrdered, 0),
    }))
  })
}

export async function queryGetDraftPurchaseOrdersCount(session: SessionUser): Promise<number> {
  return withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    return tx.purchaseOrder.count({
      where: { tenantId: session.tenantId, status: "DRAFT" },
    })
  })
}
