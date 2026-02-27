"use server"

import { z } from "zod"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError, ValidationError } from "@/lib/errors/app-error-classes"
import { ALL_ACTIONS } from "@/lib/permissions/permission-matrix"

const schema = z.object({
  roleId: z.string().min(1),
  name: z.string().min(2).max(50),
  permissions: z.array(z.enum(ALL_ACTIONS as [string, ...string[]])).min(1),
})

export async function actionUpdateRole(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session.role, "user:update-role")

    const data = schema.parse(input)

    const role = await withTenantContext(session.tenantId, async (tx) => {
      const existing = await tx.tenantRole.findFirst({
        where: { id: data.roleId, tenantId: session.tenantId },
      })
      if (!existing) throw new NotFoundError("Rôle", data.roleId)
      if (existing.isSystem) throw new ValidationError("Les rôles système ne peuvent pas être modifiés")

      return tx.tenantRole.update({
        where: { id: data.roleId },
        data: { name: data.name, permissions: data.permissions },
      })
    })

    return success({ role })
  } catch (error) {
    return handleServerActionError(error)
  }
}
