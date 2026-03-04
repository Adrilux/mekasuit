"use server"

import { z } from "zod"
import { Prisma, InterventionStatus } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan, assertSiteAccess } from "@/lib/permissions/permission-checker-server"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError, ValidationError } from "@/lib/errors/app-error-classes"
import { sendNotification } from "@/lib/notifications/notification-sender"
import { logAudit } from "@/lib/audit/audit-logger"

// Transitions de statut autorisées
const ALLOWED_TRANSITIONS: Record<InterventionStatus, InterventionStatus[]> = {
  OPEN: ["IN_PROGRESS", "PENDING_PARTS", "CANCELLED"],
  IN_PROGRESS: ["PENDING_PARTS", "CLOSED", "OPEN", "CANCELLED"],
  PENDING_PARTS: ["IN_PROGRESS", "CLOSED", "CANCELLED"],
  CLOSED: [],    // terminal
  CANCELLED: [], // terminal
}

// Nombre de jours entre occurrences selon le type de récurrence
const RECURRENCE_INTERVAL_DAYS: Record<string, number> = {
  WEEKLY: 7,
  BIWEEKLY: 14,
  MONTHLY: 30,
  QUARTERLY: 90,
  SEMIANNUAL: 180,
  ANNUAL: 365,
}

const schema = z.object({
  interventionId: z.string().min(1),
  newStatus: z.nativeEnum(InterventionStatus),
  // Champs optionnels remplis à la clôture
  actualDurationMinutes: z.coerce.number().int().min(1).max(100000).optional(),
  closingDiagnosis: z.string().max(2000).optional(),
})

export async function actionUpdateInterventionStatus(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session, "intervention:update")

    const { interventionId, newStatus, actualDurationMinutes, closingDiagnosis } = schema.parse(input)

    if (newStatus === "CLOSED") assertCan(session, "intervention:close")
    if (newStatus === "CANCELLED") assertCan(session, "intervention:cancel")

    const result = await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      const existing = await tx.intervention.findUnique({
        where: { id: interventionId },
        select: {
          siteId: true,
          status: true,
          machineId: true,
          type: true,
          title: true,
          description: true,
          priority: true,
          assignedUserId: true,
          recurrenceType: true,
          recurrenceIntervalDays: true,
          recurrenceEndsAt: true,
          scheduledAt: true,
          plannedMaterials: {
            select: { stockItemId: true, quantityPlanned: true, note: true },
          },
        },
      })

      if (!existing) throw new NotFoundError("Intervention", interventionId)
      assertSiteAccess(session, existing.siteId)

      const allowed = ALLOWED_TRANSITIONS[existing.status]
      if (!allowed.includes(newStatus)) {
        throw new ValidationError(
          `Transition "${existing.status}" → "${newStatus}" non autorisée`
        )
      }

      // Horodatages automatiques
      const timestamps: Partial<{ startedAt: Date; closedAt: Date }> = {}
      if (newStatus === "IN_PROGRESS" && existing.status === "OPEN") {
        timestamps.startedAt = new Date()
      }
      if (newStatus === "CLOSED") {
        timestamps.closedAt = new Date()
      }

      const intervention = await tx.intervention.update({
        where: { id: interventionId },
        data: {
          status: newStatus,
          ...timestamps,
          ...(newStatus === "CLOSED"
            ? {
                actualDurationMinutes: actualDurationMinutes ?? null,
                closingDiagnosis: closingDiagnosis ?? null,
              }
            : {}),
        },
      })

      // Statut machine automatique
      if (existing.machineId) {
        if (newStatus === "IN_PROGRESS") {
          await tx.machine.update({
            where: { id: existing.machineId },
            data: { status: "UNDER_MAINTENANCE" },
          })
        }

        if (newStatus === "CLOSED" || newStatus === "CANCELLED") {
          const otherActiveCount = await tx.intervention.count({
            where: {
              machineId: existing.machineId,
              id: { not: interventionId },
              status: { in: ["IN_PROGRESS", "PENDING_PARTS"] },
            },
          })

          if (otherActiveCount === 0) {
            await tx.machine.update({
              where: { id: existing.machineId },
              data: { status: "OPERATIONAL" },
            })
          }
        }
      }

      // Génération automatique de la prochaine occurrence préventive
      if (newStatus === "CLOSED" && existing.type === "PREVENTIVE" && existing.recurrenceType) {
        const intervalDays =
          existing.recurrenceType === "CUSTOM"
            ? (existing.recurrenceIntervalDays ?? 30)
            : (RECURRENCE_INTERVAL_DAYS[existing.recurrenceType] ?? 30)

        // Base de calcul : date planifiée de l'intervention clôturée, ou aujourd'hui si absente
        const baseDate = existing.scheduledAt ?? new Date()
        const nextScheduledAt = new Date(baseDate)
        nextScheduledAt.setDate(nextScheduledAt.getDate() + intervalDays)

        // Vérifier si la série est terminée
        const seriesEnded =
          existing.recurrenceEndsAt !== null &&
          existing.recurrenceEndsAt !== undefined &&
          nextScheduledAt > existing.recurrenceEndsAt

        if (!seriesEnded) {
        const nextIntervention = await tx.intervention.create({
          data: {
            tenantId: session.tenantId,
            siteId: existing.siteId,
            machineId: existing.machineId ?? null,
            assignedUserId: existing.assignedUserId ?? null,
            title: existing.title,
            description: existing.description ?? null,
            type: "PREVENTIVE",
            priority: existing.priority,
            status: "OPEN",
            scheduledAt: nextScheduledAt,
            recurrenceType: existing.recurrenceType,
            recurrenceIntervalDays: existing.recurrenceIntervalDays ?? null,
            recurrenceEndsAt: existing.recurrenceEndsAt ?? null,
            parentInterventionId: interventionId,
          },
        })

        // Copier les matériaux prévus sur la nouvelle occurrence
        if (existing.plannedMaterials.length > 0) {
          await tx.interventionPlannedMaterial.createMany({
            data: existing.plannedMaterials.map((m) => ({
              tenantId: session.tenantId,
              interventionId: nextIntervention.id,
              stockItemId: m.stockItemId,
              quantityPlanned: m.quantityPlanned,
              note: m.note ?? null,
            })),
          })
        }

        // Notifier le technicien assigné de la nouvelle occurrence préventive
        if (existing.assignedUserId && existing.assignedUserId !== session.id) {
          await sendNotification(tx, {
            tenantId: session.tenantId,
            userId: existing.assignedUserId,
            type: "INTERVENTION_ASSIGNED",
            title: "Nouvelle préventive planifiée",
            body: `La prochaine occurrence de « ${existing.title} » a été générée.`,
            link: `/interventions/${nextIntervention.id}`,
          })
        }
        } // end if (!seriesEnded)
      }

      await logAudit({
        tx,
        tenantId: session.tenantId,
        userId: session.id,
        action: `intervention.status.${newStatus.toLowerCase()}`,
        entityType: "intervention",
        entityId: interventionId,
        entityLabel: existing.title,
        changes: { before: existing.status, after: newStatus },
      })

      return intervention
    })

    return success(result)
  } catch (error) {
    return handleServerActionError(error)
  }
}
