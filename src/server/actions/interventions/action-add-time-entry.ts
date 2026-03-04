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
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Format d'heure invalide (HH:MM)"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Format d'heure invalide (HH:MM)"),
  note: z.string().max(500).optional(),
})

export async function actionAddTimeEntry(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session, "intervention:update")

    const data = schema.parse(input)

    const startedAt = new Date(`${data.date}T${data.startTime}:00`)
    const endedAt = new Date(`${data.date}T${data.endTime}:00`)

    if (isNaN(startedAt.getTime()) || isNaN(endedAt.getTime())) {
      throw new ValidationError("Date ou heure invalide")
    }
    if (endedAt <= startedAt) {
      throw new ValidationError("L'heure de fin doit être après l'heure de début")
    }

    const durationMinutes = Math.round((endedAt.getTime() - startedAt.getTime()) / 60000)
    if (durationMinutes < 1) throw new ValidationError("Durée minimale : 1 minute")
    if (durationMinutes > 24 * 60) throw new ValidationError("Durée maximale : 24 heures")

    const result = await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      const intervention = await tx.intervention.findUnique({
        where: { id: data.interventionId },
        select: { siteId: true, status: true },
      })
      if (!intervention) throw new NotFoundError("Intervention", data.interventionId)
      assertSiteAccess(session, intervention.siteId)

      if (["CLOSED", "CANCELLED"].includes(intervention.status)) {
        throw new ValidationError("Impossible de pointer sur une intervention terminée")
      }

      return tx.interventionTimeEntry.create({
        data: {
          tenantId: session.tenantId,
          interventionId: data.interventionId,
          userId: session.id,
          startedAt,
          endedAt,
          durationMinutes,
          note: data.note || null,
        },
      })
    })

    return success(result)
  } catch (error) {
    return handleServerActionError(error)
  }
}
