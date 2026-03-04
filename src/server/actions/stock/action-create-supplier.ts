"use server"

import { z } from "zod"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { Prisma } from "@prisma/client"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"

const schema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(50).optional().or(z.literal("")),
})

export async function actionCreateSupplier(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session, "stock:update")

    const { name, email, phone } = schema.parse(input)

    const supplier = await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      return tx.supplier.create({
        data: {
          tenantId: session.tenantId,
          name,
          email: email || null,
          phone: phone || null,
        },
        select: { id: true, name: true },
      })
    })

    return success(supplier)
  } catch (error) {
    return handleServerActionError(error)
  }
}
