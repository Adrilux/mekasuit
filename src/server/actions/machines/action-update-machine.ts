"use server"

import { z } from "zod"
import { Prisma } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan, assertSiteAccess } from "@/lib/permissions/permission-checker-server"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError } from "@/lib/errors/app-error-classes"

const schema = z.object({
  machineId: z.string().min(1),
  name: z.string().min(1, "Nom requis").max(100),
  serialNumber: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  manufacturer: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  installedAt: z.string().optional(),
  notes: z.string().max(2000).optional(),
})

export async function actionUpdateMachine(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session, "machine:update")

    const data = schema.parse(input)

    const result = await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      // Vérifie que la machine appartient bien à ce tenant (RLS + vérification site)
      const existing = await tx.machine.findUnique({
        where: { id: data.machineId },
        select: { siteId: true },
      })

      if (!existing) throw new NotFoundError("Machine", data.machineId)
      assertSiteAccess(session, existing.siteId)

      return tx.machine.update({
        where: { id: data.machineId },
        data: {
          name: data.name,
          serialNumber: data.serialNumber || null,
          category: data.category || null,
          manufacturer: data.manufacturer || null,
          model: data.model || null,
          installedAt: data.installedAt ? new Date(data.installedAt) : null,
          notes: data.notes !== undefined ? (data.notes || null) : undefined,
        },
      })
    })

    return success(result)
  } catch (error) {
    return handleServerActionError(error)
  }
}
