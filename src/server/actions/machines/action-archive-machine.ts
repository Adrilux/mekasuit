"use server"

import { z } from "zod"
import { Prisma, InterventionStatus } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan, assertSiteAccess } from "@/lib/permissions/permission-checker-server"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError, ValidationError } from "@/lib/errors/app-error-classes"

const schema = z.object({
  machineId: z.string().min(1),
})

export async function actionArchiveMachine(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session, "machine:archive")

    const { machineId } = schema.parse(input)

    await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      const existing = await tx.machine.findUnique({
        where: { id: machineId },
        select: { siteId: true, status: true, name: true },
      })

      if (!existing) throw new NotFoundError("Machine", machineId)
      assertSiteAccess(session, existing.siteId)

      if (existing.status === "DECOMMISSIONED") {
        throw new ValidationError("Cette machine est déjà archivée")
      }

      // Vérifie s'il y a des interventions ouvertes ou en cours
      const openInterventions = await tx.intervention.count({
        where: {
          machineId,
          status: { in: [InterventionStatus.OPEN, InterventionStatus.IN_PROGRESS, InterventionStatus.PENDING_PARTS] },
        },
      })

      if (openInterventions > 0) {
        throw new ValidationError(
          `Impossible d'archiver : ${openInterventions} intervention(s) en cours sur cette machine. Clôturez-les d'abord.`
        )
      }

      await tx.machine.update({
        where: { id: machineId },
        data: { status: "DECOMMISSIONED" },
      })
    })

    return success(undefined)
  } catch (error) {
    return handleServerActionError(error)
  }
}
