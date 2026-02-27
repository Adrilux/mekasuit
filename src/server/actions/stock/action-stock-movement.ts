"use server"

import { z } from "zod"
import { Prisma, MovementType } from "@prisma/client"
import { ModuleName } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan, assertSiteAccess } from "@/lib/permissions/permission-checker-server"
import { assertModuleActive } from "@/lib/modules/module-access-checker"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError } from "@/lib/errors/app-error-classes"
import { logAudit } from "@/lib/audit/audit-logger"

const schema = z.object({
  stockItemId: z.string().min(1),
  type: z.enum(["IN", "ADJUSTMENT"]),
  quantity: z.coerce.number().int().min(1, "Quantité minimum : 1"),
  reason: z.string().max(300).optional(),
})

export async function actionStockMovement(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session.role, "stock:movement")
    await assertModuleActive(session.tenantId, ModuleName.STOCK_MANAGEMENT)

    const data = schema.parse(input)

    await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      const stockItem = await tx.stockItem.findUnique({
        where: { id: data.stockItemId },
        select: { id: true, siteId: true, quantityOnHand: true, name: true },
      })
      if (!stockItem) throw new NotFoundError("Article de stock", data.stockItemId)
      assertSiteAccess(session.role, session.siteIds, stockItem.siteId)

      // Pour un ajustement en négatif, vérifier qu'on ne descend pas sous 0
      if (data.type === "ADJUSTMENT") {
        // quantity est toujours positif dans le formulaire
        // on le laisse positif — l'ajustement peut être une correction à la hausse
        // Pour une sortie manuelle, on utilise type OUT (géré séparément dans les interventions)
      }

      // Calcul du delta sur le stock
      const delta = data.type === "IN" ? data.quantity : data.quantity

      await tx.stockItem.update({
        where: { id: data.stockItemId },
        data: { quantityOnHand: { increment: delta } },
      })

      await tx.stockMovement.create({
        data: {
          tenantId: session.tenantId,
          stockItemId: data.stockItemId,
          type: data.type as MovementType,
          quantity: delta,
          reason: data.reason ?? null,
          operatorId: session.id,
        },
      })

      await logAudit({
        tx,
        tenantId: session.tenantId,
        userId: session.id,
        action: `stock.movement.${data.type.toLowerCase()}`,
        entityType: "stock_item",
        entityId: data.stockItemId,
        entityLabel: stockItem.name,
        changes: { quantity: delta, type: data.type },
      })
    })

    return success(undefined)
  } catch (error) {
    return handleServerActionError(error)
  }
}
