"use server"

import { z } from "zod"
import { Prisma } from "@prisma/client"
import { ModuleName } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan, assertSiteAccess } from "@/lib/permissions/permission-checker-server"
import { assertModuleActive } from "@/lib/modules/module-access-checker"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError, ValidationError } from "@/lib/errors/app-error-classes"

const schema = z.object({ stockItemId: z.string().min(1) })

export async function actionDeleteStockItem(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session.role, "stock:update")
    await assertModuleActive(session.tenantId, ModuleName.STOCK_MANAGEMENT)

    const { stockItemId } = schema.parse(input)

    await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      const item = await tx.stockItem.findUnique({
        where: { id: stockItemId },
        select: { siteId: true, name: true, _count: { select: { movements: true, partsUsed: true } } },
      })
      if (!item) throw new NotFoundError("Article de stock", stockItemId)
      assertSiteAccess(session.role, session.siteIds, item.siteId)

      if (item._count.movements > 0 || item._count.partsUsed > 0) {
        throw new ValidationError(
          `Impossible de supprimer "${item.name}" : il a des mouvements ou a été utilisé dans des interventions`
        )
      }

      await tx.stockItem.delete({ where: { id: stockItemId } })
    })

    return success(undefined)
  } catch (error) {
    return handleServerActionError(error)
  }
}
