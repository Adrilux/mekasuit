"use server"

import { z } from "zod"
import { Prisma } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError } from "@/lib/errors/app-error-classes"

const schema = z.object({
  checklistId: z.string().min(1),
  label: z.string().min(1, "Libellé requis").max(500),
  isRequired: z.boolean().default(false),
})

export async function actionAddChecklistItem(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session.role, "intervention:update")

    const data = schema.parse(input)

    const result = await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      const checklist = await tx.interventionChecklist.findUnique({
        where: { id: data.checklistId },
        select: { id: true },
      })
      if (!checklist) throw new NotFoundError("Checklist", data.checklistId)

      // Calcul position
      const maxPos = await tx.interventionChecklistItem.aggregate({
        where: { checklistId: data.checklistId },
        _max: { position: true },
      })
      const position = (maxPos._max.position ?? -1) + 1

      return tx.interventionChecklistItem.create({
        data: {
          tenantId: session.tenantId,
          checklistId: data.checklistId,
          label: data.label,
          isRequired: data.isRequired,
          position,
        },
      })
    })

    return success(result)
  } catch (error) {
    return handleServerActionError(error)
  }
}
