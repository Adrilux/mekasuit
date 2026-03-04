"use server"

import { z } from "zod"
import { Prisma } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertSiteAccess } from "@/lib/permissions/permission-checker-server"
import { assertModuleActive } from "@/lib/modules/module-access-checker"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError, ValidationError } from "@/lib/errors/app-error-classes"
import { ModuleName } from "@prisma/client"
import { notifyIfStockLow } from "@/lib/notifications/notify-stock-low"

const schema = z.object({
  interventionId: z.string().min(1),
  stockItemId: z.string().min(1),
  quantity: z.number().int().min(1, "Quantité minimum : 1"),
})

export async function actionConsumeStockPart(input: unknown) {
  try {
    const session = await requireSession()
    // La consommation de pièces requiert le module stock
    await assertModuleActive(session.tenantId, ModuleName.STOCK_MANAGEMENT)

    const { interventionId, stockItemId, quantity } = schema.parse(input)

    await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      // Vérifie l'intervention
      const intervention = await tx.intervention.findUnique({
        where: { id: interventionId },
        select: { siteId: true, status: true },
      })

      if (!intervention) throw new NotFoundError("Intervention", interventionId)
      assertSiteAccess(session, intervention.siteId)

      if (intervention.status === "CLOSED" || intervention.status === "CANCELLED") {
        throw new ValidationError("Impossible d'ajouter des pièces à une intervention terminée")
      }

      // Vérifie le stock disponible
      const stockItem = await tx.stockItem.findUnique({
        where: { id: stockItemId },
        select: { id: true, name: true, reference: true, quantityOnHand: true, siteId: true, minimumLevel: true },
      })

      if (!stockItem) throw new NotFoundError("Pièce", stockItemId)

      if (stockItem.quantityOnHand < quantity) {
        throw new ValidationError(
          `Stock insuffisant pour "${stockItem.name}" : ${stockItem.quantityOnHand} disponible(s), ${quantity} demandée(s)`
        )
      }

      // Enregistre la pièce utilisée
      await tx.interventionPartUsed.create({
        data: {
          tenantId: session.tenantId,
          interventionId,
          stockItemId,
          quantity,
        },
      })

      // Déduit du stock
      await tx.stockItem.update({
        where: { id: stockItemId },
        data: { quantityOnHand: { decrement: quantity } },
      })

      // Enregistre le mouvement de stock pour traçabilité
      await tx.stockMovement.create({
        data: {
          tenantId: session.tenantId,
          stockItemId,
          type: "OUT",
          quantity,
          reason: `Consommée sur intervention #${interventionId}`,
          operatorId: session.id,
        },
      })

      // Notifier si stock sous le seuil après consommation
      const newQuantity = stockItem.quantityOnHand - quantity
      await notifyIfStockLow({
        tx,
        tenantId: session.tenantId,
        stockItemId,
        stockItemName: stockItem.name,
        stockItemReference: stockItem.reference,
        siteId: stockItem.siteId,
        newQuantity,
        minimumLevel: stockItem.minimumLevel,
      })
    })

    return success(undefined)
  } catch (error) {
    return handleServerActionError(error)
  }
}
