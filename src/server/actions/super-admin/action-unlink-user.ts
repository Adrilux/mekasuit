"use server"

import { z } from "zod"
import { requireSuperAdmin } from "@/lib/auth/auth-session-helpers"
import { prisma } from "@/lib/db/prisma-client-singleton"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { ValidationError } from "@/lib/errors/app-error-classes"

const schema = z.object({
  tenantUserId: z.string().min(1),
})

export async function actionUnlinkUser(input: unknown) {
  try {
    await requireSuperAdmin()

    const { tenantUserId } = schema.parse(input)

    const tenantUser = await prisma.tenantUser.findUnique({
      where: { id: tenantUserId },
    })

    if (!tenantUser) {
      throw new ValidationError("Lien utilisateur introuvable")
    }

    if (tenantUser.role === "super_admin") {
      throw new ValidationError(
        "Impossible de délier un compte super_admin via cette interface"
      )
    }

    await prisma.tenantUser.delete({ where: { id: tenantUserId } })

    return success(undefined)
  } catch (error) {
    return handleServerActionError(error)
  }
}
