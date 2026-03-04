"use server"

import { z } from "zod"
import { Prisma } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan, assertSiteAccess } from "@/lib/permissions/permission-checker-server"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError } from "@/lib/errors/app-error-classes"
import { sendNotification } from "@/lib/notifications/notification-sender"
import { sendEmail } from "@/lib/email/email-sender"
import { buildInterventionAssignedEmail } from "@/lib/email/templates/email-intervention-assigned"
import { queryGetUsersByAuthIds } from "@/server/queries/users/query-get-users-by-auth-ids"
import { serverEnv } from "@/lib/env/env-server-schema"

const schema = z.object({
  interventionId: z.string().min(1),
  assignedUserId: z.string().nullable(), // null = désassigner
})

export async function actionAssignIntervention(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session, "intervention:assign")

    const { interventionId, assignedUserId } = schema.parse(input)

    let interventionTitle = ""

    await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      const existing = await tx.intervention.findUnique({
        where: { id: interventionId },
        select: { siteId: true, status: true, title: true, scheduledAt: true, priority: true, machine: { select: { name: true } } },
      })
      if (!existing) throw new NotFoundError("Intervention", interventionId)
      assertSiteAccess(session, existing.siteId)

      interventionTitle = existing.title

      await tx.intervention.update({
        where: { id: interventionId },
        data: { assignedUserId: assignedUserId ?? null },
      })

      // Notifier le nouveau technicien assigné (pas si on désassigne)
      if (assignedUserId && assignedUserId !== session.id) {
        await sendNotification(tx, {
          tenantId: session.tenantId,
          userId: assignedUserId,
          type: "INTERVENTION_ASSIGNED",
          title: "Intervention assignée",
          body: `Vous avez été assigné(e) à : ${existing.title}`,
          link: `/interventions/${interventionId}`,
        })

        // Email au technicien — hors transaction, best-effort
        void (async () => {
          const users = await queryGetUsersByAuthIds([assignedUserId])
          const tech = users[0]
          if (!tech?.email) return

          const html = buildInterventionAssignedEmail({
            technicianName: tech.name,
            interventionTitle: existing.title,
            interventionId,
            machineName: existing.machine?.name,
            scheduledAt: existing.scheduledAt
              ? new Date(existing.scheduledAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })
              : undefined,
            priority: existing.priority,
            appUrl: serverEnv.BETTER_AUTH_URL,
          })

          await sendEmail({
            to: tech.email,
            subject: `Intervention assignée : ${existing.title}`,
            html,
          })
        })()
      }
    })

    return success({})
  } catch (error) {
    return handleServerActionError(error)
  }
}
