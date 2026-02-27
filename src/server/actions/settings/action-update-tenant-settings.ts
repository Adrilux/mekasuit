"use server"

import { z } from "zod"
import { Prisma } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"

const schema = z.object({
  name: z.string().min(2, "Nom minimum 2 caractères").max(100),
})

export async function actionUpdateTenantSettings(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session.role, "module:activate") // client_admin+

    const data = schema.parse(input)

    await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      await tx.tenant.update({
        where: { id: session.tenantId },
        data: { name: data.name },
      })
    })

    return success(null)
  } catch (error) {
    return handleServerActionError(error)
  }
}
