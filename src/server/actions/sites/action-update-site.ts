"use server"

import { z } from "zod"
import { Prisma } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError } from "@/lib/errors/app-error-classes"

const schema = z.object({
  siteId: z.string().min(1),
  name: z.string().min(1, "Nom requis").max(100),
  address: z.string().max(300).optional(),
})

export async function actionUpdateSite(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session, "site:update")

    const data = schema.parse(input)

    const result = await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      const existing = await tx.site.findUnique({
        where: { id: data.siteId },
        select: { id: true },
      })

      if (!existing) throw new NotFoundError("Site", data.siteId)

      return tx.site.update({
        where: { id: data.siteId },
        data: { name: data.name, address: data.address || null },
      })
    })

    return success(result)
  } catch (error) {
    return handleServerActionError(error)
  }
}
