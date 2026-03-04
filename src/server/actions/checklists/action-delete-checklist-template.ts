"use server"

import { z } from "zod"
import { Prisma } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError } from "@/lib/errors/app-error-classes"

const schema = z.object({ templateId: z.string().min(1) })

export async function actionDeleteChecklistTemplate(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session, "intervention:update")

    const { templateId } = schema.parse(input)

    await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      const template = await tx.checklistTemplate.findUnique({
        where: { id: templateId },
        select: { id: true },
      })
      if (!template) throw new NotFoundError("Modèle", templateId)

      await tx.checklistTemplate.delete({ where: { id: templateId } })
    })

    return success(undefined)
  } catch (error) {
    return handleServerActionError(error)
  }
}
