"use server"

import { z } from "zod"
import { Prisma } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError, ValidationError } from "@/lib/errors/app-error-classes"

const schema = z.object({
  interventionId: z.string().min(1),
  materials: z.array(z.object({
    stockItemId: z.string().min(1),
    quantityPlanned: z.coerce.number().int().min(1).max(9999),
    note: z.string().max(200).optional(),
  })),
})

export async function actionUpdatePlannedMaterials(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session.role, "intervention:update")

    const { interventionId, materials } = schema.parse(input)

    await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      const intervention = await tx.intervention.findUnique({
        where: { id: interventionId },
        select: { tenantId: true, siteId: true, type: true },
      })
      if (!intervention || intervention.tenantId !== session.tenantId) {
        throw new NotFoundError("Intervention", interventionId)
      }
      if (intervention.type !== "PREVENTIVE") {
        throw new ValidationError("Les matériaux planifiés ne sont disponibles que pour les préventives")
      }

      // Remplace toute la liste (delete + recreate)
      await tx.interventionPlannedMaterial.deleteMany({ where: { interventionId } })
      if (materials.length > 0) {
        await tx.interventionPlannedMaterial.createMany({
          data: materials.map((m) => ({
            tenantId: session.tenantId,
            interventionId,
            stockItemId: m.stockItemId,
            quantityPlanned: m.quantityPlanned,
            note: m.note || null,
          })),
        })
      }
    })

    return success(undefined)
  } catch (error) {
    return handleServerActionError(error)
  }
}
