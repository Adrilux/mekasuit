"use server"

import { z } from "zod"
import { Prisma } from "@prisma/client"
import { ModuleName } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan, assertSiteAccess } from "@/lib/permissions/permission-checker-server"
import { assertModuleActive } from "@/lib/modules/module-access-checker"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"

const schema = z.object({
  siteId: z.string().min(1),
  reference: z.string().min(1, "Référence requise").max(100),
  name: z.string().min(1, "Nom requis").max(200),
  unit: z.string().min(1).max(20).default("pièce"),
  quantityOnHand: z.coerce.number().int().min(0).default(0),
  minimumLevel: z.coerce.number().int().min(0).default(0),
  unitCostCents: z.coerce.number().int().min(0).default(0),
})

export async function actionCreateStockItem(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session, "stock:create")
    await assertModuleActive(session.tenantId, ModuleName.STOCK_MANAGEMENT)

    const data = schema.parse(input)
    assertSiteAccess(session, data.siteId)

    const result = await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      return tx.stockItem.create({
        data: {
          tenantId: session.tenantId,
          siteId: data.siteId,
          reference: data.reference,
          name: data.name,
          unit: data.unit,
          quantityOnHand: data.quantityOnHand,
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
