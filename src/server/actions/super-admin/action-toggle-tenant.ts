"use server"

import { z } from "zod"
import { requireSuperAdmin } from "@/lib/auth/auth-session-helpers"
import { prisma } from "@/lib/db/prisma-client-singleton"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"

const schema = z.object({
  tenantId: z.string().min(1),
  isActive: z.boolean(),
})

export async function actionToggleTenant(input: unknown) {
  try {
    await requireSuperAdmin()

    const { tenantId, isActive } = schema.parse(input)

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { isActive },
    })

    return success(undefined)
  } catch (error) {
    return handleServerActionError(error)
  }
}
