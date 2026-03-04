"use server"

import { z } from "zod"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { prisma } from "@/lib/db/prisma-client-singleton"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError, ValidationError } from "@/lib/errors/app-error-classes"

const schema = z.object({ tenantUserId: z.string().min(1) })

export async function actionDeactivateUser(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session, "user:deactivate")

    const { tenantUserId } = schema.parse(input)

    const existing = await prisma.tenantUser.findUnique({
      where: { id: tenantUserId },
      select: { tenantId: true, authUserId: true, isActive: true, role: true },
    })

    if (!existing || existing.tenantId !== session.tenantId) {
      throw new NotFoundError("Utilisateur", tenantUserId)
    }

    if (existing.authUserId === session.id) {
      throw new ValidationError("Vous ne pouvez pas désactiver votre propre compte")
    }

    if (!existing.isActive) {
      throw new ValidationError("Cet utilisateur est déjà désactivé")
    }

    await prisma.tenantUser.update({
      where: { id: tenantUserId },
      data: { isActive: false },
    })

    return success(undefined)
  } catch (error) {
    return handleServerActionError(error)
  }
}
