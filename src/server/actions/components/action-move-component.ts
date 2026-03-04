"use server"

import { z } from "zod"
import { Prisma } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan, assertSiteAccess } from "@/lib/permissions/permission-checker-server"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError, ValidationError } from "@/lib/errors/app-error-classes"

const schema = z.object({
  componentId: z.string().min(1),
  newParentId: z.string().min(1).nullable(),
})

function getDescendantIds(
  componentId: string,
  allComponents: { id: string; parentId: string | null }[],
): Set<string> {
  const ids = new Set<string>()
  const queue = [componentId]
  while (queue.length > 0) {
    const current = queue.shift()!
    for (const c of allComponents) {
      if (c.parentId === current) {
        ids.add(c.id)
        queue.push(c.id)
      }
    }
  }
  return ids
}

export async function actionMoveComponent(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session, "machine:update")

    const data = schema.parse(input)

    const result = await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      const existing = await tx.machineComponent.findUnique({
        where: { id: data.componentId },
        include: { machine: { select: { siteId: true, id: true } } },
      })
      if (!existing) throw new NotFoundError("Composant", data.componentId)
      assertSiteAccess(session, existing.machine.siteId)

      if (data.newParentId === data.componentId) {
        throw new ValidationError("Un composant ne peut pas être son propre parent")
      }

      if (data.newParentId !== null) {
        const newParent = await tx.machineComponent.findUnique({
          where: { id: data.newParentId },
          select: { machineId: true },
        })
        if (!newParent || newParent.machineId !== existing.machineId) {
          throw new ValidationError("Le nœud parent cible n'appartient pas à cette machine")
        }

        const allComponents = await tx.machineComponent.findMany({
          where: { machineId: existing.machineId },
          select: { id: true, parentId: true },
        })
        const descendants = getDescendantIds(data.componentId, allComponents)
        if (descendants.has(data.newParentId)) {
          throw new ValidationError("Impossible : le nœud cible est un descendant du composant déplacé")
        }
      }

      return tx.machineComponent.update({
        where: { id: data.componentId },
        data: { parentId: data.newParentId },
      })
    })

    return success(result)
  } catch (error) {
    return handleServerActionError(error)
  }
}
