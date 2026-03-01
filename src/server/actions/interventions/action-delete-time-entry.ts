"use server"

import { z } from "zod"
import { Prisma } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError, ValidationError } from "@/lib/errors/app-error-classes"

const schema = z.object({ entryId: z.string().min(1) })

export async function actionDeleteTimeEntry(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session.role, "intervention:update")

    const { entryId } = schema.parse(input)

    await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      const entry = await tx.interventionTimeEntry.findUnique({
        where: { id: entryId },
        select: { id: true, userId: true },
      })
      if (!entry) throw new NotFoundError("Session de pointage", entryId)

      const isOwner = entry.userId === session.id
      const isManager = ["super_admin", "client_admin", "workshop_manager"].includes(session.role)
      if (!isOwner && !isManager) {
        throw new ValidationError("Vous ne pouvez pas supprimer la session d'un autre utilisateur")
      }

      await tx.interventionTimeEntry.delete({ where: { id: entryId } })
    })

    return success(undefined)
  } catch (error) {
    return handleServerActionError(error)
  }
}
