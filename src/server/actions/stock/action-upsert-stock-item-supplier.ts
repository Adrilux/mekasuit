"use server"

import { z } from "zod"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { Prisma } from "@prisma/client"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError } from "@/lib/errors/app-error-classes"

const schema = z.object({
  stockItemId: z.string().min(1),
  supplierId: z.string().min(1),
  supplierReference: z.string().max(200).optional().or(z.literal("")),
  purchasePriceCents: z.number().int().min(0).default(0),
  leadTimeDays: z.number().int().min(1).max(999).nullable().optional(),
})

export async function actionUpsertStockItemSupplier(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session.role, "stock:update")

    const { stockItemId, supplierId, supplierReference, purchasePriceCents, leadTimeDays } = schema.parse(input)

    await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      // Vérifier que l'article appartient au tenant
      const stockItem = await tx.stockItem.findFirst({
        where: { id: stockItemId, tenantId: session.tenantId },
        select: { id: true },
      })
      if (!stockItem) throw new NotFoundError("Article", stockItemId)

      // Vérifier que le fournisseur appartient au tenant
      const supplier = await tx.supplier.findFirst({
        where: { id: supplierId, tenantId: session.tenantId },
        select: { id: true },
      })
      if (!supplier) throw new NotFoundError("Fournisseur", supplierId)

      await tx.stockItemSupplier.upsert({
        where: { stockItemId_supplierId: { stockItemId, supplierId } },
        create: {
          tenantId: session.tenantId,
          stockItemId,
          supplierId,
          supplierReference: supplierReference || null,
          purchasePriceCents,
          leadTimeDays: leadTimeDays ?? null,
        },
        update: {
          supplierReference: supplierReference || null,
          purchasePriceCents,
          leadTimeDays: leadTimeDays ?? null,
        },
      })
    })

    return success(undefined)
  } catch (error) {
    return handleServerActionError(error)
  }
}
