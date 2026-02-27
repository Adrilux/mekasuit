"use server"

import { z } from "zod"
import { Prisma } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan, assertSiteAccess } from "@/lib/permissions/permission-checker-server"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError } from "@/lib/errors/app-error-classes"
import { sendNotification } from "@/lib/notifications/notification-sender"

const schema = z.object({
  interventionId: z.string().min(1),
  assignedUserId: z.string().nullable(), // null = désassigner
})

export async function actionAssignIntervention(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session.role, "intervention:assign")

    const { interventionId, assignedUserId } = schema.parse(input)

    await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      const existing = await tx.intervention.findUnique({
        where: { id: interventionId },
        select: { siteId: true, status: true, title: true },
      })
      if (!existing) throw new NotFoundError("Intervention", interventionId)
      assertSiteAccess(session.role, session.siteIds, existing.siteId)

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
      }
    })

    return success({})
  } catch (error) {
    return handleServerActionError(error)
  }
}
