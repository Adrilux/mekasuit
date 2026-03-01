"use server"

import { z } from "zod"
import { Prisma, ModuleName } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan, assertSiteAccess } from "@/lib/permissions/permission-checker-server"
import { assertModuleActive } from "@/lib/modules/module-access-checker"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { AppError } from "@/lib/errors/app-error-classes"

const schema = z.object({
  siteId: z.string().min(1),
})

export async function actionCreateInventorySession(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session.role, "stock:movement")
    await assertModuleActive(session.tenantId, ModuleName.STOCK_MANAGEMENT)

    const { siteId } = schema.parse(input)
    assertSiteAccess(session.role, session.siteIds, siteId)

    const result = await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      // Vérifier qu'il n'y a pas déjà une session ouverte sur ce site
      const existing = await tx.stockInventorySession.findFirst({
        where: { tenantId: session.tenantId, siteId, status: "OPEN" },
        select: { id: true },
      })
      if (existing) {
        throw new AppError("Une session d'inventaire est déjà en cours sur ce site", "INVENTORY_SESSION_OPEN")
      }

      // Snapshot de tous les articles du site
      const stockItems = await tx.stockItem.findMany({
        where: { tenantId: session.tenantId, siteId },
        select: { id: true, quantityOnHand: true },
      })

      if (stockItems.length === 0) {
        throw new AppError("Aucun article en stock sur ce site", "NO_STOCK_ITEMS")
      }

      const inventorySession = await tx.stockInventorySession.create({
        data: {
          tenantId: session.tenantId,
          siteId,
          createdBy: session.id,
          items: {
            createMany: {
              data: stockItems.map((item) => ({
                tenantId: session.tenantId,
                stockItemId: item.id,
                systemQuantity: item.quantityOnHand,
              })),
            },
          },
        },
        select: { id: true },
      })

      return inventorySession
    })

    return success(result)
  } catch (error) {
    return handleServerActionError(error)
  }
}
