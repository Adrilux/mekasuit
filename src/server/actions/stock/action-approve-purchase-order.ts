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
})

export async function actionApprovePurchaseOrder(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session.role, "stock:po:approve")
    await assertModuleActive(session.tenantId, ModuleName.STOCK_MANAGEMENT)

    const { orderId } = schema.parse(input)

    await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      const order = await tx.purchaseOrder.findFirst({
        where: { id: orderId, tenantId: session.tenantId },
        select: { id: true, siteId: true, status: true },
      })
      if (!order) throw new NotFoundError("Commande fournisseur", orderId)
      assertSiteAccess(session.role, session.siteIds, order.siteId)

      if (order.status !== "DRAFT") {
        throw new AppError("Seule une commande en brouillon peut être approuvée", "PO_INVALID_STATUS")
      }

      await tx.purchaseOrder.update({
        where: { id: orderId },
        data: { status: "ORDERED", approvedBy: session.id, approvedAt: new Date() },
      })

      await logAudit({
        tx,
        tenantId: session.tenantId,
        userId: session.id,
        action: "stock.purchase_order.approve",
        entityType: "purchase_order",
        entityId: orderId,
        entityLabel: `Commande fournisseur`,
        changes: { status: "ORDERED" },
      })
    })

    return success(undefined)
  } catch (error) {
    return handleServerActionError(error)
  }
}
