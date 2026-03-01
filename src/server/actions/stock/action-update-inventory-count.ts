"use server"

import { z } from "zod"
import { Prisma, ModuleName } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { assertModuleActive } from "@/lib/modules/module-access-checker"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError, AppError } from "@/lib/errors/app-error-classes"

const schema = z.object({
  inventoryItemId: z.string().min(1),
  countedQuantity: z.coerce.number().int().min(0),
  note: z.string().max(300).optional().or(z.literal("")),
})

export async function actionUpdateInventoryCount(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session.role, "stock:movement")
    await assertModuleActive(session.tenantId, ModuleName.STOCK_MANAGEMENT)

    const { inventoryItemId, countedQuantity, note } = schema.parse(input)

    await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      const item = await tx.stockInventoryItem.findFirst({
        where: { id: inventoryItemId, tenantId: session.tenantId },
        select: { id: true, session: { select: { status: true } } },
      })
      if (!item) throw new NotFoundError("Item d'inventaire", inventoryItemId)
      if (item.session.status === "CLOSED") {
        throw new AppError("Cette session d'inventaire est déjà clôturée", "INVENTORY_SESSION_CLOSED")
      }

      await tx.stockInventoryItem.update({
        where: { id: inventoryItemId },
        data: {
          countedQuantity,
          note: note || null,
        },
      })
    })

    return success(undefined)
  } catch (error) {
    return handleServerActionError(error)
  }
}
