"use server"

import { z } from "zod"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { prisma } from "@/lib/db/prisma-client-singleton"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError } from "@/lib/errors/app-error-classes"

const schema = z.object({
  stockItemId: z.string().min(1),
  machineId: z.string().nullable(), // null = délier
})

export async function actionLinkStockItemToMachine(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session.role, "stock:update")

    const { stockItemId, machineId } = schema.parse(input)

    const stockItem = await prisma.stockItem.findFirst({
      where: { id: stockItemId, tenantId: session.tenantId },
      select: { id: true, siteId: true },
    })
    if (!stockItem) throw new NotFoundError("Article", stockItemId)

    // Si machineId fourni, vérifie qu'elle est sur le même site
    if (machineId) {
      const machine = await prisma.machine.findFirst({
        where: { id: machineId, tenantId: session.tenantId, siteId: stockItem.siteId },
        select: { id: true },
      })
      if (!machine) throw new NotFoundError("Machine", machineId)
    }

    await prisma.stockItem.update({
      where: { id: stockItemId },
      data: { machineId },
    })

    return success(undefined)
  } catch (error) {
    return handleServerActionError(error)
  }
}
