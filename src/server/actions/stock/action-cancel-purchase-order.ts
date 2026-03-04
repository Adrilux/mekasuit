"use server"

import { z } from "zod"
import { Prisma, ModuleName } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan, assertSiteAccess } from "@/lib/permissions/permission-checker-server"
import { assertModuleActive } from "@/lib/modules/module-access-checker"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError, AppError } from "@/lib/errors/app-error-classes"
import { logAudit } from "@/lib/audit/audit-logger"

const schema = z.object({
  orderId: z.string().min(1),
  reason: z.string().max(500).optional(),
})

export async function actionCancelPurchaseOrder(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session, "stock:po:cancel")
    await assertModuleActive(session.tenantId, ModuleName.STOCK_MANAGEMENT)

    const { orderId, reason } = schema.parse(input)

    await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      const order = await tx.purchaseOrder.findFirst({
        where: { id: orderId, tenantId: session.tenantId },
        select: { id: true, siteId: true, status: true },
      })
      if (!order) throw new NotFoundError("Commande fournisseur", orderId)
      assertSiteAccess(session, order.siteId)

      if (order.status === "RECEIVED") {
        throw new AppError("Une commande déjà réceptionnée ne peut pas être annulée", "PO_ALREADY_RECEIVED")
      }
      if (order.status === "CANCELLED") {
        throw new AppError("Cette commande est déjà annulée", "PO_ALREADY_CANCELLED")
      }

      await tx.purchaseOrder.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      })

      await logAudit({
        tx,
        tenantId: session.tenantId,
        userId: session.id,
        action: "stock.purchase_order.cancel",
        entityType: "purchase_order",
        entityId: orderId,
        entityLabel: `Commande fournisseur`,
        changes: { reason: reason ?? null },
      })
    })

    return success(undefined)
  } catch (error) {
    return handleServerActionError(error)
  }
}
