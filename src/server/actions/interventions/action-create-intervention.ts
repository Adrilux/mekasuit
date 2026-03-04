"use server"

import { z } from "zod"
import { Prisma, InterventionType, InterventionPriority, RecurrenceType } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan, assertSiteAccess } from "@/lib/permissions/permission-checker-server"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { ValidationError } from "@/lib/errors/app-error-classes"
import { logAudit } from "@/lib/audit/audit-logger"

const schema = z.object({
  siteId: z.string().min(1),
  machineId: z.string().optional(),
  title: z.string().min(1, "Titre requis").max(200),
  description: z.string().max(2000).optional(),
  type: z.nativeEnum(InterventionType),
  priority: z.nativeEnum(InterventionPriority),
  assignedUserId: z.string().optional(),
  scheduledAt: z.string().optional(),
  // Récurrence (PREVENTIVE uniquement)
  recurrenceType: z.nativeEnum(RecurrenceType).optional(),
  recurrenceIntervalDays: z.coerce.number().int().min(1).max(3650).optional(),
  recurrenceEndsAt: z.string().optional(), // date ISO string
})

export async function actionCreateIntervention(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session, "intervention:create")

    const data = schema.parse(input)
    assertSiteAccess(session, data.siteId)

    // La récurrence n'est valide que pour les interventions préventives
    if (data.recurrenceType && data.type !== "PREVENTIVE") {
      throw new ValidationError("La récurrence n'est disponible que pour les interventions préventives")
    }
    if (data.recurrenceType === "CUSTOM" && !data.recurrenceIntervalDays) {
      throw new ValidationError("L'intervalle en jours est requis pour une récurrence personnalisée")
    }

    const result = await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      const intervention = await tx.intervention.create({
        data: {
          tenantId: session.tenantId,
          siteId: data.siteId,
          machineId: data.machineId || null,
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
      await logAudit({
        tx,
        tenantId: session.tenantId,
        userId: session.id,
        action: "intervention.created",
        entityType: "intervention",
        entityId: intervention.id,
        entityLabel: intervention.title,
      })
      return intervention
    })

    return success(result)
  } catch (error) {
    return handleServerActionError(error)
  }
}
