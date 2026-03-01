"use server"

import { z } from "zod"
import { Prisma, MachineStatus } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan, assertSiteAccess } from "@/lib/permissions/permission-checker-server"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError, ValidationError } from "@/lib/errors/app-error-classes"
import { logAudit } from "@/lib/audit/audit-logger"

const schema = z.object({
  machineId: z.string().min(1),
  status: z.enum([MachineStatus.OPERATIONAL, MachineStatus.UNDER_MAINTENANCE]),
})

export async function actionUpdateMachineStatus(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session.role, "machine:update")

    const { machineId, status } = schema.parse(input)

    await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      const existing = await tx.machine.findUnique({
        where: { id: machineId },
        select: { siteId: true, status: true, name: true },
      })

      if (!existing) throw new NotFoundError("Machine", machineId)
      assertSiteAccess(session.role, session.siteIds, existing.siteId)

      if (existing.status === "DECOMMISSIONED") {
        throw new ValidationError("Impossible de changer le statut d'une machine archivée")
      }

      if (existing.status === status) {
        throw new ValidationError("La machine est déjà dans ce statut")
      }

      await tx.machine.update({
        where: { id: machineId },
        data: { status },
      })

      await logAudit({
        tx,
        tenantId: session.tenantId,
        userId: session.id,
        action: "machine.status_changed",
        entityType: "machine",
        entityId: machineId,
        entityLabel: existing.name,
        changes: { from: existing.status, to: status },
      })
    })

    return success(undefined)
  } catch (error) {
    return handleServerActionError(error)
  }
}
