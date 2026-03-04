"use server"

import { z } from "zod"
import { Prisma, ModuleName } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertSiteAccess } from "@/lib/permissions/permission-checker-server"
import { assertModuleActive } from "@/lib/modules/module-access-checker"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError, ValidationError } from "@/lib/errors/app-error-classes"

const schema = z.object({
  interventionId: z.string().min(1),
  items: z.array(
    z.object({
      stockItemId: z.string().min(1),
      quantity: z.number().int().min(1),
    })
  ).min(1),
})

/**
 * Consomme plusieurs pièces prévues en une seule transaction atomique.
 * Chaque pièce crée un InterventionPartUsed + décrémente le stock + crée un StockMovement.
 * Si une pièce a déjà un InterventionPartUsed sur cette intervention, elle est ignorée (idempotent).
 */
export async function actionConsumePlannedMaterials(input: unknown) {
  try {
    const session = await requireSession()
    await assertModuleActive(session.tenantId, ModuleName.STOCK_MANAGEMENT)

    const { interventionId, items } = schema.parse(input)

    await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      const intervention = await tx.intervention.findUnique({
        where: { id: interventionId },
        select: { siteId: true, status: true },
      })
      if (!intervention) throw new NotFoundError("Intervention", interventionId)
      assertSiteAccess(session, intervention.siteId)

      if (["CLOSED", "CANCELLED"].includes(intervention.status)) {
        throw new ValidationError("Impossible de consommer des pièces sur une intervention terminée")
      }

      // Récupère les pièces déjà consommées sur cette intervention (pour éviter les doublons)
      const alreadyConsumed = await tx.interventionPartUsed.findMany({
        where: { interventionId },
        select: { stockItemId: true },
      })
      const alreadyConsumedIds = new Set(alreadyConsumed.map((p) => p.stockItemId))

      // Filtre les items non encore consommés
      const toConsume = items.filter((i) => !alreadyConsumedIds.has(i.stockItemId))
      if (toConsume.length === 0) return // Tout déjà consommé

      // Vérifie le stock pour chaque item
      const stockItemIds = toConsume.map((i) => i.stockItemId)
      const stockItems = await tx.stockItem.findMany({
        where: { id: { in: stockItemIds } },
        select: { id: true, name: true, quantityOnHand: true },
      })
      const stockMap = new Map(stockItems.map((s) => [s.id, s]))

      for (const item of toConsume) {
        const stock = stockMap.get(item.stockItemId)
        if (!stock) throw new NotFoundError("Pièce", item.stockItemId)
        if (stock.quantityOnHand < item.quantity) {
          throw new ValidationError(
            `Stock insuffisant pour "${stock.name}" : ${stock.quantityOnHand} dispo, ${item.quantity} demandée(s)`
          )
        }
      }

      // Tout est OK — consommation atomique
      for (const item of toConsume) {
        await tx.interventionPartUsed.create({
          data: {
            tenantId: session.tenantId,
            interventionId,
            stockItemId: item.stockItemId,
            quantity: item.quantity,
          },
        })
        await tx.stockItem.update({
          where: { id: item.stockItemId },
          data: { quantityOnHand: { decrement: item.quantity } },
        })
        await tx.stockMovement.create({
          data: {
            tenantId: session.tenantId,
            stockItemId: item.stockItemId,
            type: "OUT",
            quantity: item.quantity,
            reason: `Consommation préventive — intervention #${interventionId}`,
            operatorId: session.id,
          },
        })
      }
    })

    return success(undefined)
  } catch (error) {
    return handleServerActionError(error)
  }
}
