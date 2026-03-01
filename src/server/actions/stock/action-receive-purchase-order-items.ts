"use server"

import { z } from "zod"
import { Prisma, ModuleName, MovementType } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan, assertSiteAccess } from "@/lib/permissions/permission-checker-server"
import { assertModuleActive } from "@/lib/modules/module-access-checker"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError, AppError } from "@/lib/errors/app-error-classes"
import { logAudit } from "@/lib/audit/audit-logger"

const schema = z.object({
  orderId: z.string().min(1),
  receipts: z
    .array(
      z.object({
        itemId: z.string().min(1),
        quantityReceived: z.coerce.number().int().min(1),
      }),
    )
    .min(1, "Au moins un article à réceptionner"),
})

export async function actionReceivePurchaseOrderItems(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session.role, "stock:po:receive")
    await assertModuleActive(session.tenantId, ModuleName.STOCK_MANAGEMENT)

    const { orderId, receipts } = schema.parse(input)

    const result = await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      const order = await tx.purchaseOrder.findFirst({
        where: { id: orderId, tenantId: session.tenantId },
        select: {
          id: true,
          siteId: true,
          status: true,
          items: {
            select: { id: true, stockItemId: true, quantityOrdered: true, quantityReceived: true },
          },
        },
      })
      if (!order) throw new NotFoundError("Commande fournisseur", orderId)
      assertSiteAccess(session.role, session.siteIds, order.siteId)

      if (order.status !== "ORDERED") {
        throw new AppError(
          "Seule une commande approuvée (ORDERED) peut être réceptionnée",
          "PO_INVALID_STATUS",
        )
      }

      for (const receipt of receipts) {
        const item = order.items.find((i) => i.id === receipt.itemId)
        if (!item) throw new NotFoundError("Article de commande", receipt.itemId)

        const remaining = item.quantityOrdered - item.quantityReceived
        if (receipt.quantityReceived > remaining) {
          throw new AppError(
            `Quantité reçue (${receipt.quantityReceived}) dépasse le restant à recevoir (${remaining})`,
            "PO_QUANTITY_EXCEEDED",
          )
        }

        await tx.purchaseOrderItem.update({
          where: { id: item.id },
          data: { quantityReceived: { increment: receipt.quantityReceived } },
        })

        await tx.stockItem.update({
          where: { id: item.stockItemId },
          data: { quantityOnHand: { increment: receipt.quantityReceived } },
        })

        await tx.stockMovement.create({
          data: {
            tenantId: session.tenantId,
            stockItemId: item.stockItemId,
            type: MovementType.IN,
            quantity: receipt.quantityReceived,
            reason: `Réception BC #${orderId.slice(-6).toUpperCase()}`,
            operatorId: session.id,
          },
        })
      }

      // Vérifier si tout est réceptionné → RECEIVED
      const updatedItems = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId: orderId, tenantId: session.tenantId },
        select: { quantityOrdered: true, quantityReceived: true },
      })
      const fullyReceived = updatedItems.every((i) => i.quantityReceived >= i.quantityOrdered)

      if (fullyReceived) {
        await tx.purchaseOrder.update({
          where: { id: orderId },
          data: { status: "RECEIVED", receivedAt: new Date() },
        })
      }

      await logAudit({
        tx,
        tenantId: session.tenantId,
        userId: session.id,
        action: "stock.purchase_order.receive",
        entityType: "purchase_order",
        entityId: orderId,
        entityLabel: `Commande fournisseur`,
        changes: { receipts, fullyReceived },
      })

      return { fullyReceived }
    })

    return success(result)
  } catch (error) {
    return handleServerActionError(error)
  }
}
