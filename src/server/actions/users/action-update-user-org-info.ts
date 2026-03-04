"use server"

import { z } from "zod"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { prisma } from "@/lib/db/prisma-client-singleton"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError, ValidationError } from "@/lib/errors/app-error-classes"

const schema = z.object({
  tenantUserId: z.string().min(1),
  jobTitle: z.string().max(100).nullable(),
  managerId: z.string().nullable(), // authUserId du manager, ou null
})

export async function actionUpdateUserOrgInfo(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session, "user:invite")

    const { tenantUserId, jobTitle, managerId } = schema.parse(input)

    const existing = await prisma.tenantUser.findUnique({
      where: { id: tenantUserId },
      select: { tenantId: true, authUserId: true },
    })

    if (!existing || existing.tenantId !== session.tenantId) {
      throw new NotFoundError("Utilisateur", tenantUserId)
    }

    // Vérifie que le manager appartient bien au même tenant
    if (managerId) {
      const managerTenantUser = await prisma.tenantUser.findFirst({
        where: { tenantId: session.tenantId, authUserId: managerId },
        select: { id: true },
      })
      if (!managerTenantUser) {
        throw new ValidationError("Manager introuvable dans ce tenant")
      }
      // Interdit de se désigner soi-même comme manager
      if (managerId === existing.authUserId) {
        throw new ValidationError("Un utilisateur ne peut pas être son propre manager")
      }
    }

    await prisma.tenantUser.update({
      where: { id: tenantUserId },
      data: { jobTitle, managerId },
    })

    return success(undefined)
  } catch (error) {
    return handleServerActionError(error)
  }
}
