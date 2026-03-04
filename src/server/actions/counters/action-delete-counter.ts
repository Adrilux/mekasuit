"use server"

import { z } from "zod"
import { Prisma } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan, assertSiteAccess } from "@/lib/permissions/permission-checker-server"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError } from "@/lib/errors/app-error-classes"

const schema = z.object({ counterId: z.string().min(1) })

export async function actionDeleteCounter(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session, "machine:update")

    const { counterId } = schema.parse(input)

    await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      const counter = await tx.machineCounter.findUnique({
        where: { id: counterId },
        include: { machine: { select: { siteId: true } } },
      })
      if (!counter) throw new NotFoundError("Compteur", counterId)
      assertSiteAccess(session, counter.machine.siteId)

      await tx.machineCounter.delete({ where: { id: counterId } })
    })

    return success(undefined)
  } catch (error) {
    return handleServerActionError(error)
  }
}
