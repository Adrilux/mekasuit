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
  sessionId: z.string().min(1),
})

export async function actionCloseInventorySession(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session.role, "stock:movement")
    await assertModuleActive(session.tenantId, ModuleName.STOCK_MANAGEMENT)

    const { sessionId } = schema.parse(input)

    const stats = await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      const inventorySession = await tx.stockInventorySession.findFirst({
        where: { id: sessionId, tenantId: session.tenantId },
        select: {
          id: true,
          siteId: true,
          status: true,
          items: {
            select: {
              id: true,
              stockItemId: true,
              systemQuantity: true,
              countedQuantity: true,
              stockItem: { select: { name: true } },
            },
          },
        },
      })
      if (!inventorySession) throw new NotFoundError("Session d'inventaire", sessionId)
      assertSiteAccess(session.role, session.siteIds, inventorySession.siteId)

      if (inventorySession.status === "CLOSED") {
        throw new AppError("Cette session est déjà clôturée", "INVENTORY_SESSION_CLOSED")
      }

      // Vérifier que tous les items ont été comptés
      const uncounted = inventorySession.items.filter((i) => i.countedQuantity === null)
      if (uncounted.length > 0) {
        throw new AppError(
          `${uncounted.length} article(s) non encore compté(s)`,
          "INVENTORY_UNCOUNTED_ITEMS",
        )
      }

      // Générer les ajustements pour les écarts
      let adjustedCount = 0
      for (const item of inventorySession.items) {
        const counted = item.countedQuantity!
        const delta = counted - item.systemQuantity
        if (delta === 0) continue

        adjustedCount++

        await tx.stockItem.update({
          where: { id: item.stockItemId },
          data: { quantityOnHand: { increment: delta } },
        })

        await tx.stockMovement.create({
          data: {
            tenantId: session.tenantId,
            stockItemId: item.stockItemId,
            type: MovementType.ADJUSTMENT,
            quantity: Math.abs(delta),
            reason: `Inventaire physique — écart ${delta > 0 ? "+" : ""}${delta}`,
            operatorId: session.id,
          },
        })
      }

      // Clôturer la session
      await tx.stockInventorySession.update({
        where: { id: sessionId },
        data: { status: "CLOSED", closedAt: new Date(), closedBy: session.id },
      })

      await logAudit({
        tx,
        tenantId: session.tenantId,
        userId: session.id,
        action: "stock.inventory.close",
        entityType: "stock_inventory_session",
        entityId: sessionId,
        entityLabel: `Inventaire du ${new Date().toLocaleDateString("fr-FR")}`,
        changes: { adjustedItems: adjustedCount, totalItems: inventorySession.items.length },
      })

      return { adjustedCount, totalItems: inventorySession.items.length }
    })

    return success(stats)
  } catch (error) {
    return handleServerActionError(error)
  }
}
