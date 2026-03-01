"use server"

import { z } from "zod"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { Prisma } from "@prisma/client"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"

const schema = z.object({
  linkId: z.string().min(1),
})

export async function actionUnlinkStockItemSupplier(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session.role, "stock:update")

    const { linkId } = schema.parse(input)

    await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      await tx.stockItemSupplier.deleteMany({
        where: { id: linkId, tenantId: session.tenantId },
      })
    })

    return success(undefined)
  } catch (error) {
    return handleServerActionError(error)
  }
}
