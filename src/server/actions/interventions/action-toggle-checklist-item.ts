"use server"

import { z } from "zod"
import { Prisma } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError } from "@/lib/errors/app-error-classes"

const schema = z.object({
  itemId: z.string().min(1),
  checked: z.boolean(),
})

export async function actionToggleChecklistItem(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session.role, "intervention:update")

    const data = schema.parse(input)

    const result = await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      const item = await tx.interventionChecklistItem.findUnique({
        where: { id: data.itemId },
        select: { id: true },
      })
      if (!item) throw new NotFoundError("Item", data.itemId)

      return tx.interventionChecklistItem.update({
        where: { id: data.itemId },
        data: {
          isChecked: data.checked,
          checkedAt: data.checked ? new Date() : null,
          checkedBy: data.checked ? session.id : null,
        },
      })
    })

    return success(result)
  } catch (error) {
    return handleServerActionError(error)
  }
}
