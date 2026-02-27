"use server"

import { z } from "zod"
import { Prisma } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertSiteAccess } from "@/lib/permissions/permission-checker-server"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError, ValidationError } from "@/lib/errors/app-error-classes"

const schema = z.object({
  interventionId: z.string().min(1),
  content: z.string().min(1, "Note vide").max(5000),
})

export async function actionAddInterventionNote(input: unknown) {
  try {
    const session = await requireSession()

    const { interventionId, content } = schema.parse(input)

    const result = await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      const intervention = await tx.intervention.findUnique({
        where: { id: interventionId },
        select: { siteId: true, status: true },
      })

      if (!intervention) throw new NotFoundError("Intervention", interventionId)
      assertSiteAccess(session.role, session.siteIds, intervention.siteId)

      if (intervention.status === "CANCELLED") {
        throw new ValidationError("Impossible d'ajouter une note à une intervention annulée")
      }

      return tx.interventionNote.create({
        data: {
          tenantId: session.tenantId,
          interventionId,
          authorUserId: session.id,
          content,
        },
      })
    })

    return success(result)
  } catch (error) {
    return handleServerActionError(error)
  }
}
