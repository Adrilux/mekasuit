"use server"

import { z } from "zod"
import { Prisma } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan, assertSiteAccess } from "@/lib/permissions/permission-checker-server"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError } from "@/lib/errors/app-error-classes"

const schema = z.object({
  componentId: z.string().min(1),
  name: z.string().min(1, "Nom requis").max(200),
  description: z.string().max(2000).optional(),
  quantity: z.coerce.number().int().min(1).default(1),
  // null = délier, undefined = ne pas toucher, string = lier
  stockItemId: z.string().min(1).nullable().optional(),
})

export async function actionUpdateComponent(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session, "machine:update")

    const data = schema.parse(input)

    const result = await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      const existing = await tx.machineComponent.findUnique({
        where: { id: data.componentId },
        include: { machine: { select: { siteId: true } } },
      })
      if (!existing) throw new NotFoundError("Composant", data.componentId)
      assertSiteAccess(session, existing.machine.siteId)

      return tx.machineComponent.update({
        where: { id: data.componentId },
        data: {
          name: data.name,
          description: data.description !== undefined ? (data.description || null) : undefined,
          quantity: data.quantity,
          ...(data.stockItemId !== undefined ? { stockItemId: data.stockItemId } : {}),
        },
      })
    })

    return success(result)
  } catch (error) {
    return handleServerActionError(error)
  }
}
