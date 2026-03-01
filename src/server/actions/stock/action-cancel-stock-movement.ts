"use server"

import { z } from "zod"
import { Prisma, ModuleName, MovementType } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { assertModuleActive } from "@/lib/modules/module-access-checker"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError, AppError } from "@/lib/errors/app-error-classes"
import { logAudit } from "@/lib/audit/audit-logger"

const CANCELLABLE_TYPES: MovementType[] = [MovementType.IN, MovementType.OUT, MovementType.ADJUSTMENT]

const schema = z.object({
  movementId: z.string().min(1),
  reason: z.string().max(300).optional().or(z.literal("")),
})

export async function actionCancelStockMovement(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session.role, "stock:movement:cancel")
    await assertModuleActive(session.tenantId, ModuleName.STOCK_MANAGEMENT)

    const { movementId, reason } = schema.parse(input)

    await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      const movement = await tx.stockMovement.findFirst({
        where: { id: movementId, tenantId: session.tenantId },
        select: {
          id: true,
          type: true,
          quantity: true,
          cancelledAt: true,
          stockItem: { select: { id: true, siteId: true, name: true } },
        },
      })
      if (!movement) throw new NotFoundError("Mouvement", movementId)

      if (movement.cancelledAt !== null) {
        throw new AppError("Ce mouvement a déjà été annulé", "MOVEMENT_ALREADY_CANCELLED")
      }

      if (!CANCELLABLE_TYPES.includes(movement.type)) {
        throw new AppError(
          "Les mouvements de transfert ne peuvent pas être annulés directement",
          "MOVEMENT_NOT_CANCELLABLE",
        )
      }

      // Calcul du delta compensatoire
      // IN → on avait incrementé → on décrémente
      // OUT → on avait décrémenté → on incrémente
      // ADJUSTMENT → on avait incrementé → on décrémente (retour à l'état précédent)
      const compensatoryDelta = movement.type === MovementType.OUT
        ? movement.quantity    // remet le stock
        : -movement.quantity   // retire ce qui avait été ajouté

      await tx.stockItem.update({
        where: { id: movement.stockItem.id },
        data: { quantityOnHand: { increment: compensatoryDelta } },
      })

      // Mouvement compensatoire ADJUSTMENT
      await tx.stockMovement.create({
        data: {
          tenantId: session.tenantId,
          stockItemId: movement.stockItem.id,
          type: MovementType.ADJUSTMENT,
          quantity: movement.quantity,
          reason: `Annulation mouvement ${movement.type} #${movementId.slice(-6)}${reason ? ` — ${reason}` : ""}`,
          operatorId: session.id,
        },
      })

      // Marquer le mouvement original comme annulé
      await tx.stockMovement.update({
        where: { id: movementId },
        data: {
          cancelledAt: new Date(),
          cancelledBy: session.id,
          cancelReason: reason || null,
        },
      })

      await logAudit({
        tx,
        tenantId: session.tenantId,
        userId: session.id,
        action: "stock.movement.cancel",
        entityType: "stock_item",
        entityId: movement.stockItem.id,
        entityLabel: movement.stockItem.name,
        changes: { movementId, type: movement.type, quantity: movement.quantity, reason },
      })
    })

    return success(undefined)
  } catch (error) {
    return handleServerActionError(error)
  }
}
