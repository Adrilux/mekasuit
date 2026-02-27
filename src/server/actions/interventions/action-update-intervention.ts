"use server"

import { z } from "zod"
import { Prisma, InterventionType, InterventionPriority, RecurrenceType } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan, assertSiteAccess } from "@/lib/permissions/permission-checker-server"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError, ValidationError } from "@/lib/errors/app-error-classes"

const schema = z.object({
  interventionId: z.string().min(1),
  title: z.string().min(1, "Titre requis").max(200),
  description: z.string().max(2000).optional(),
  type: z.nativeEnum(InterventionType),
  priority: z.nativeEnum(InterventionPriority),
  assignedUserId: z.string().optional(),
  scheduledAt: z.string().optional(),
  // Récurrence (PREVENTIVE uniquement)
  recurrenceType: z.nativeEnum(RecurrenceType).optional(),
  recurrenceIntervalDays: z.coerce.number().int().min(1).max(3650).optional(),
  recurrenceEndsAt: z.string().optional(),
})

export async function actionUpdateIntervention(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session.role, "intervention:update")

    const data = schema.parse(input)

    if (data.recurrenceType && data.type !== "PREVENTIVE") {
      throw new ValidationError("La récurrence n'est disponible que pour les interventions préventives")
    }
    if (data.recurrenceType === "CUSTOM" && !data.recurrenceIntervalDays) {
      throw new ValidationError("L'intervalle en jours est requis pour une récurrence personnalisée")
    }

    const result = await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      const existing = await tx.intervention.findUnique({
        where: { id: data.interventionId },
        select: { siteId: true, status: true },
      })

      if (!existing) throw new NotFoundError("Intervention", data.interventionId)
      assertSiteAccess(session.role, session.siteIds, existing.siteId)

      if (existing.status === "CLOSED" || existing.status === "CANCELLED") {
        throw new ValidationError("Impossible de modifier une intervention clôturée ou annulée")
      }

      return tx.intervention.update({
        where: { id: data.interventionId },
        data: {
          title: data.title,
          description: data.description || null,
          type: data.type,
          priority: data.priority,
          assignedUserId: data.assignedUserId || null,
          scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
          recurrenceType: data.recurrenceType ?? null,
          recurrenceIntervalDays: data.recurrenceType === "CUSTOM" ? (data.recurrenceIntervalDays ?? null) : null,
          recurrenceEndsAt: data.recurrenceEndsAt ? new Date(data.recurrenceEndsAt) : null,
        },
      })
    })

    return success(result)
  } catch (error) {
    return handleServerActionError(error)
  }
}
