"use server"

import { z } from "zod"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { ALL_ACTIONS } from "@/lib/permissions/permission-matrix"

const schema = z.object({
  name: z.string().min(2, "Nom trop court").max(50),
  permissions: z.array(z.enum(ALL_ACTIONS as [string, ...string[]])).min(1, "Sélectionnez au moins une permission"),
})

export async function actionCreateRole(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session, "role:update")

    const data = schema.parse(input)

    const role = await withTenantContext(session.tenantId, async (tx) => {
      return tx.tenantRole.create({
        data: {
          tenantId: session.tenantId,
          name: data.name,
          permissions: data.permissions,
          isSystem: false,
        },
      })
    })

    return success({ role })
  } catch (error) {
    return handleServerActionError(error)
  }
}
