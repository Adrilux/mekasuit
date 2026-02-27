"use server"

import { z } from "zod"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError, ValidationError } from "@/lib/errors/app-error-classes"

const schema = z.object({
  roleId: z.string().min(1),
})

export async function actionDeleteRole(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session.role, "user:update-role")

    const { roleId } = schema.parse(input)

    await withTenantContext(session.tenantId, async (tx) => {
      const existing = await tx.tenantRole.findFirst({
        where: { id: roleId, tenantId: session.tenantId },
        include: { _count: { select: { tenantUsers: true } } },
      })
      if (!existing) throw new NotFoundError("Rôle", roleId)
      if (existing.isSystem) throw new ValidationError("Les rôles système ne peuvent pas être supprimés")
      if (existing._count.tenantUsers > 0) {
        throw new ValidationError(
          `Ce rôle est assigné à ${existing._count.tenantUsers} utilisateur(s). Réassignez-les avant de supprimer ce rôle.`
        )
      }

      await tx.tenantRole.delete({ where: { id: roleId } })
    })

    return success({})
  } catch (error) {
    return handleServerActionError(error)
  }
}
