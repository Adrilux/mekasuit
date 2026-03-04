"use server"

import { z } from "zod"
import { Prisma } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError } from "@/lib/errors/app-error-classes"

const schema = z.object({ checklistId: z.string().min(1) })

export async function actionDeleteChecklist(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session, "intervention:update")

    const { checklistId } = schema.parse(input)

    await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      const checklist = await tx.interventionChecklist.findUnique({
        where: { id: checklistId },
        select: { id: true },
      })
      if (!checklist) throw new NotFoundError("Checklist", checklistId)

      await tx.interventionChecklist.delete({ where: { id: checklistId } })
    })

    return success(undefined)
  } catch (error) {
    return handleServerActionError(error)
  }
}
