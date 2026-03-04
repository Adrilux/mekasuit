"use server"

import { z } from "zod"
import { Prisma, InterventionStatus } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError, ValidationError } from "@/lib/errors/app-error-classes"

const schema = z.object({
  siteId: z.string().min(1),
})

export async function actionDeactivateSite(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session, "site:deactivate")

    const { siteId } = schema.parse(input)

    await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      const existing = await tx.site.findUnique({
        where: { id: siteId },
        select: { isActive: true, name: true },
      })

      if (!existing) throw new NotFoundError("Site", siteId)

      if (!existing.isActive) {
        throw new ValidationError("Ce site est déjà désactivé")
      }

      // Bloque si des interventions ouvertes existent sur ce site
      const openInterventions = await tx.intervention.count({
        where: {
          siteId,
          status: { in: [InterventionStatus.OPEN, InterventionStatus.IN_PROGRESS, InterventionStatus.PENDING_PARTS] },
        },
      })

      if (openInterventions > 0) {
        throw new ValidationError(
          `Impossible de désactiver : ${openInterventions} intervention(s) ouverte(s) sur ce site. Clôturez-les d'abord.`
        )
      }

      await tx.site.update({
        where: { id: siteId },
        data: { isActive: false },
      })
    })

    return success(undefined)
  } catch (error) {
    return handleServerActionError(error)
  }
}
