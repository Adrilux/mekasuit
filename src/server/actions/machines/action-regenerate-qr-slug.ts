"use server"

import { z } from "zod"
import { Prisma } from "@prisma/client"
import { randomUUID } from "crypto"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan, assertSiteAccess } from "@/lib/permissions/permission-checker-server"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError } from "@/lib/errors/app-error-classes"

const schema = z.object({
  machineId: z.string().min(1),
})

export async function actionRegenerateQrSlug(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session, "machine:update")

    const { machineId } = schema.parse(input)

    const result = await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      const existing = await tx.machine.findUnique({
        where: { id: machineId },
        select: { siteId: true },
      })
      if (!existing) throw new NotFoundError("Machine", machineId)
      assertSiteAccess(session, existing.siteId)

      const newSlug = randomUUID()
      return tx.machine.update({
        where: { id: machineId },
        data: { qrCodeSlug: newSlug },
        select: { qrCodeSlug: true },
      })
    })

    return success(result)
  } catch (error) {
    return handleServerActionError(error)
  }
}
