"use server"

import { z } from "zod"
import { Prisma } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertSiteAccess } from "@/lib/permissions/permission-checker-server"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError, ValidationError } from "@/lib/errors/app-error-classes"

const schema = z.object({
  partUsedId: z.string().min(1),
})

export async function actionRemoveConsumedPart(input: unknown) {
  try {
    const session = await requireSession()

    const { partUsedId } = schema.parse(input)

    await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      const partUsed = await tx.interventionPartUsed.findUnique({
        where: { id: partUsedId },
        include: {
          intervention: { select: { siteId: true, status: true } },
          stockItem: { select: { id: true } },
        },
      })

      if (!partUsed) throw new NotFoundError("Pièce consommée", partUsedId)
      assertSiteAccess(session.role, session.siteIds, partUsed.intervention.siteId)

      if (["CLOSED", "CANCELLED"].includes(partUsed.intervention.status)) {
        throw new ValidationError("Impossible de retirer une pièce d'une intervention terminée")
      }

      // Supprime l'enregistrement
      await tx.interventionPartUsed.delete({ where: { id: partUsedId } })

      // Remet la quantité en stock
      await tx.stockItem.update({
        where: { id: partUsed.stockItemId },
        data: { quantityOnHand: { increment: partUsed.quantity } },
      })

      // Mouvement de stock d'annulation
      await tx.stockMovement.create({
        data: {
          tenantId: session.tenantId,
          stockItemId: partUsed.stockItemId,
          type: "ADJUSTMENT",
          quantity: partUsed.quantity,
          reason: `Annulation consommation intervention #${partUsed.interventionId}`,
          operatorId: session.id,
        },
      })
    })

    return success(undefined)
  } catch (error) {
    return handleServerActionError(error)
  }
}
