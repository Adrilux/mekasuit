"use server"

import { z } from "zod"
import { Prisma } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan, assertSiteAccess } from "@/lib/permissions/permission-checker-server"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError } from "@/lib/errors/app-error-classes"

const schema = z.object({ componentId: z.string().min(1) })

export async function actionDeleteComponent(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session, "machine:update")

    const { componentId } = schema.parse(input)

    await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      const component = await tx.machineComponent.findUnique({
        where: { id: componentId },
        include: { machine: { select: { siteId: true } } },
      })
      if (!component) throw new NotFoundError("Composant", componentId)
      assertSiteAccess(session, component.machine.siteId)

      await tx.machineComponent.delete({ where: { id: componentId } })
    })

    return success(undefined)
  } catch (error) {
    return handleServerActionError(error)
  }
}
