"use server"

import { z } from "zod"
import { Prisma } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan, assertSiteAccess } from "@/lib/permissions/permission-checker-server"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError, ValidationError } from "@/lib/errors/app-error-classes"

const schema = z.object({
  machineId: z.string().min(1),
  parentId: z.string().min(1).optional(),
  name: z.string().min(1, "Nom requis").max(200),
  description: z.string().max(2000).optional(),
  quantity: z.coerce.number().int().min(1).default(1),
  stockItemId: z.string().min(1).optional(),
})

export async function actionCreateComponent(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session.role, "machine:update")

    const data = schema.parse(input)

    const result = await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      const machine = await tx.machine.findUnique({
        where: { id: data.machineId },
        select: { siteId: true },
      })
      if (!machine) throw new NotFoundError("Machine", data.machineId)
      assertSiteAccess(session.role, session.siteIds, machine.siteId)

      if (data.parentId) {
        const parent = await tx.machineComponent.findUnique({
          where: { id: data.parentId },
          select: { machineId: true },
        })
        if (!parent || parent.machineId !== data.machineId) {
          throw new ValidationError("Le nœud parent n'appartient pas à cette machine")
        }
      }

      const maxPosition = await tx.machineComponent.aggregate({
        where: {
          machineId: data.machineId,
          parentId: data.parentId ?? null,
        },
        _max: { position: true },
      })
      const position = (maxPosition._max.position ?? -1) + 1

      return tx.machineComponent.create({
        data: {
          tenantId: session.tenantId,
          machineId: data.machineId,
          parentId: data.parentId ?? null,
          name: data.name,
          description: data.description || null,
          quantity: data.quantity,
          stockItemId: data.stockItemId ?? null,
          position,
        },
      })
    })

    return success(result)
  } catch (error) {
    return handleServerActionError(error)
  }
}
