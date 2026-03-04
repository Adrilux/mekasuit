"use server"

import { z } from "zod"
import { Prisma } from "@prisma/client"
import { ModuleName } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan, assertSiteAccess } from "@/lib/permissions/permission-checker-server"
import { assertModuleActive } from "@/lib/modules/module-access-checker"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError } from "@/lib/errors/app-error-classes"

const schema = z.object({
  stockItemId: z.string().min(1),
  reference: z.string().min(1, "Référence requise").max(100),
  name: z.string().min(1, "Nom requis").max(200),
  unit: z.string().min(1).max(20),
  minimumLevel: z.coerce.number().int().min(0),
  unitCostCents: z.coerce.number().int().min(0),
})

export async function actionUpdateStockItem(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session, "stock:update")
    await assertModuleActive(session.tenantId, ModuleName.STOCK_MANAGEMENT)

    const data = schema.parse(input)

    const result = await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      const existing = await tx.stockItem.findUnique({
        where: { id: data.stockItemId },
        select: { siteId: true },
      })
      if (!existing) throw new NotFoundError("Article de stock", data.stockItemId)
      assertSiteAccess(session, existing.siteId)

      return tx.stockItem.update({
        where: { id: data.stockItemId },
        data: {
          reference: data.reference,
          name: data.name,
          unit: data.unit,
          minimumLevel: data.minimumLevel,
          unitCostCents: data.unitCostCents,
        },
      })
    })

    return success(result)
  } catch (error) {
    return handleServerActionError(error)
  }
}
