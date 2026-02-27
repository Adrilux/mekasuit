"use server"

import { z } from "zod"
import { Prisma } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { assertSiteAccess } from "@/lib/permissions/permission-checker-server"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { logAudit } from "@/lib/audit/audit-logger"

const schema = z.object({
  siteId: z.string().min(1),
  name: z.string().min(1, "Nom requis").max(100),
  serialNumber: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  manufacturer: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  installedAt: z.string().optional(), // ISO date string
})

export async function actionCreateMachine(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session.role, "machine:create")

    const data = schema.parse(input)
    assertSiteAccess(session.role, session.siteIds, data.siteId)

    const result = await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      const machine = await tx.machine.create({
        data: {
          tenantId: session.tenantId,
          siteId: data.siteId,
          name: data.name,
          serialNumber: data.serialNumber || null,
          category: data.category || null,
          manufacturer: data.manufacturer || null,
          model: data.model || null,
          installedAt: data.installedAt ? new Date(data.installedAt) : null,
        },
      })
      await logAudit({
        tx,
        tenantId: session.tenantId,
        userId: session.id,
        action: "machine.created",
        entityType: "machine",
        entityId: machine.id,
        entityLabel: machine.name,
      })
      return machine
    })

    return success(result)
  } catch (error) {
    return handleServerActionError(error)
  }
}
