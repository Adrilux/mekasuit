"use server"

import { z } from "zod"
import { Prisma } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { assertCanAddSite } from "@/lib/license/license-limits-checker"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"

const schema = z.object({
  name: z.string().min(1, "Nom requis").max(100),
  address: z.string().max(300).optional(),
})

export async function actionCreateSite(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session.role, "site:create")
    await assertCanAddSite(session.tenantId) // vérifie la limite de licence

    const data = schema.parse(input)

    const result = await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      return tx.site.create({
        data: {
          tenantId: session.tenantId,
          name: data.name,
          address: data.address || null,
        },
      })
    })

    return success(result)
  } catch (error) {
    return handleServerActionError(error)
  }
}
