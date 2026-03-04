"use server"

import { z } from "zod"
import { Prisma, InterventionPriority } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan, assertSiteAccess } from "@/lib/permissions/permission-checker-server"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError } from "@/lib/errors/app-error-classes"

const schema = z.object({
  machineId: z.string().min(1),
  name: z.string().min(1, "Nom requis").max(100),
  unit: z.string().min(1, "Unité requise").max(20),
  // Seuil déclencheur
  thresholdValue: z.coerce.number().positive().optional(),
  thresholdInterval: z.coerce.number().positive().optional(),
  triggerTitle: z.string().max(200).optional(),
  triggerDescription: z.string().max(2000).optional(),
  triggerPriority: z.nativeEnum(InterventionPriority).optional(),
})

export async function actionCreateCounter(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session, "machine:update")

    const data = schema.parse(input)

    const result = await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      const machine = await tx.machine.findUnique({
        where: { id: data.machineId },
        select: { siteId: true },
      })
      if (!machine) throw new NotFoundError("Machine", data.machineId)
      assertSiteAccess(session, machine.siteId)

      return tx.machineCounter.create({
        data: {
          tenantId: session.tenantId,
          machineId: data.machineId,
          name: data.name,
          unit: data.unit,
          thresholdValue: data.thresholdValue ?? null,
          thresholdInterval: data.thresholdInterval ?? null,
          triggerTitle: data.triggerTitle || null,
          triggerDescription: data.triggerDescription || null,
          triggerPriority: data.triggerPriority ?? null,
        },
      })
    })

    return success(result)
  } catch (error) {
    return handleServerActionError(error)
  }
}
