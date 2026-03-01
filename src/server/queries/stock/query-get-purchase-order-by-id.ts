import { Prisma } from "@prisma/client"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import type { SessionUser } from "@/lib/auth/auth-session-helpers"

export type PurchaseOrderDetail = {
  id: string
  siteId: string
  status: "DRAFT" | "ORDERED" | "RECEIVED" | "CANCELLED"
  expectedDeliveryDate: Date | null
  notes: string | null
  createdBy: string
  approvedBy: string | null
  approvedAt: Date | null
  receivedAt: Date | null
  createdAt: Date
  supplier: {
    id: string
    name: string
    email: string | null
    phone: string | null
  }
  items: {
    id: string
    stockItemId: string
    quantityOrdered: number
    unitPriceCents: number
    quantityReceived: number
    stockItem: {
      name: string
      reference: string
      unit: string
      quantityOnHand: number
    }
  }[]
}

export async function queryGetPurchaseOrderById(
  session: SessionUser,
  orderId: string,
): Promise<PurchaseOrderDetail | null> {
  return withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    return tx.purchaseOrder.findFirst({
      where: { id: orderId, tenantId: session.tenantId },
      select: {
        id: true,
        siteId: true,
        status: true,
        expectedDeliveryDate: true,
        notes: true,
        createdBy: true,
        approvedBy: true,
        approvedAt: true,
        receivedAt: true,
        createdAt: true,
        supplier: { select: { id: true, name: true, email: true, phone: true } },
        items: {
          select: {
            id: true,
            stockItemId: true,
            quantityOrdered: true,
            unitPriceCents: true,
            quantityReceived: true,
            stockItem: {
              select: { name: true, reference: true, unit: true, quantityOnHand: true },
            },
          },
          orderBy: { stockItem: { name: "asc" } },
        },
      },
    })
  })
}
