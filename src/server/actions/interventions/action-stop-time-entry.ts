"use server"

import { z } from "zod"
import { Prisma } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError, ValidationError } from "@/lib/errors/app-error-classes"

const schema = z.object({
  entryId: z.string().min(1),
  note: z.string().max(500).optional(),
})

export async function actionStopTimeEntry(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session.role, "intervention:update")

    const data = schema.parse(input)

    const result = await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      const entry = await tx.interventionTimeEntry.findUnique({
        where: { id: data.entryId },
        select: { id: true, userId: true, startedAt: true, endedAt: true },
      })
      if (!entry) throw new NotFoundError("Session de pointage", data.entryId)
      if (entry.userId !== session.id && !["super_admin", "client_admin", "workshop_manager"].includes(session.role)) {
        throw new ValidationError("Vous ne pouvez pas clore la session d'un autre utilisateur")
      }
      if (entry.endedAt) throw new ValidationError("Cette session est déjà terminée")

      const now = new Date()
      const durationMinutes = Math.round((now.getTime() - new Date(entry.startedAt).getTime()) / 60000)

      return tx.interventionTimeEntry.update({
        where: { id: data.entryId },
        data: {
          endedAt: now,
          durationMinutes,
          ...(data.note ? { note: data.note } : {}),
        },
      })
    })

    return success(result)
  } catch (error) {
    return handleServerActionError(error)
  }
}
