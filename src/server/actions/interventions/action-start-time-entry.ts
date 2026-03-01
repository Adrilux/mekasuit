"use server"

import { z } from "zod"
import { Prisma } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan, assertSiteAccess } from "@/lib/permissions/permission-checker-server"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError, ValidationError } from "@/lib/errors/app-error-classes"

const schema = z.object({
  interventionId: z.string().min(1),
  note: z.string().max(500).optional(),
})

export async function actionStartTimeEntry(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session.role, "intervention:update")

    const data = schema.parse(input)

    const result = await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      const intervention = await tx.intervention.findUnique({
        where: { id: data.interventionId },
        select: { siteId: true, status: true },
      })
      if (!intervention) throw new NotFoundError("Intervention", data.interventionId)
      assertSiteAccess(session.role, session.siteIds, intervention.siteId)

      if (["CLOSED", "CANCELLED"].includes(intervention.status)) {
        throw new ValidationError("Impossible de pointer sur une intervention terminée")
      }

      // Vérifier qu'il n'y a pas déjà une session ouverte pour cet utilisateur
      const openEntry = await tx.interventionTimeEntry.findFirst({
        where: {
          interventionId: data.interventionId,
          userId: session.id,
          endedAt: null,
        },
      })
      if (openEntry) throw new ValidationError("Une session de pointage est déjà en cours")

      return tx.interventionTimeEntry.create({
        data: {
          tenantId: session.tenantId,
          interventionId: data.interventionId,
          userId: session.id,
          startedAt: new Date(),
          note: data.note || null,
        },
      })
    })

    return success(result)
  } catch (error) {
    return handleServerActionError(error)
  }
}
