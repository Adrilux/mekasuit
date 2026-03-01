"use server"

import { z } from "zod"
import { Prisma } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError } from "@/lib/errors/app-error-classes"

const schema = z.object({ templateId: z.string().min(1) })

export async function actionDeleteInterventionTemplate(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session.role, "intervention:update")

    const data = schema.parse(input)

    await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      const existing = await tx.interventionTemplate.findUnique({ where: { id: data.templateId } })
      if (!existing) throw new NotFoundError("Modèle", data.templateId)
      await tx.interventionTemplate.delete({ where: { id: data.templateId } })
    })

    return success(null)
  } catch (error) {
    return handleServerActionError(error)
  }
}
