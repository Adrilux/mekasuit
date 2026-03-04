"use server"

import { z } from "zod"
import { Prisma } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan, assertSiteAccess } from "@/lib/permissions/permission-checker-server"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError, ValidationError } from "@/lib/errors/app-error-classes"
import { logAudit } from "@/lib/audit/audit-logger"

const schema = z.object({
  machineId: z.string().min(1),
})

export async function actionRestoreMachine(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session, "machine:archive") // même permission que l'archivage

    const { machineId } = schema.parse(input)

    await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      const existing = await tx.machine.findUnique({
        where: { id: machineId },
        select: { siteId: true, status: true, name: true },
      })

      if (!existing) throw new NotFoundError("Machine", machineId)
      assertSiteAccess(session, existing.siteId)

      if (existing.status !== "DECOMMISSIONED") {
        throw new ValidationError("Cette machine n'est pas archivée")
      }

      await tx.machine.update({
        where: { id: machineId },
        data: { status: "OPERATIONAL" },
      })

      await logAudit({
        tx,
        tenantId: session.tenantId,
        userId: session.id,
        action: "machine.restored",
        entityType: "machine",
        entityId: machineId,
        entityLabel: existing.name,
      })
    })

    return success(undefined)
  } catch (error) {
    return handleServerActionError(error)
  }
}
