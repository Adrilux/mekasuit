"use server"

import { z } from "zod"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { prisma } from "@/lib/db/prisma-client-singleton"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError } from "@/lib/errors/app-error-classes"

const schema = z.object({
  tenantUserId: z.string().min(1),
  name: z.string().min(2, "Nom trop court").max(100),
  siteIds: z.array(z.string()).min(1, "Assignez au moins un site"),
})

export async function actionUpdateUserInfo(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session, "user:invite")

    const { tenantUserId, name, siteIds } = schema.parse(input)

    // Vérifie que l'utilisateur appartient bien au tenant courant
    const tenantUser = await prisma.tenantUser.findFirst({
      where: { id: tenantUserId, tenantId: session.tenantId },
    })
    if (!tenantUser) throw new NotFoundError("Utilisateur", tenantUserId)

    // Met à jour le nom dans la table Better Auth
    await prisma.$executeRaw`
      UPDATE "user" SET name = ${name}, "updatedAt" = NOW() WHERE id = ${tenantUser.authUserId}
    `

    // Recalcule les assignations de sites
    await prisma.$transaction(async (tx) => {
      await tx.userSite.deleteMany({ where: { tenantUserId } })
      await tx.userSite.createMany({
        data: siteIds.map((siteId) => ({
          tenantId: session.tenantId,
          tenantUserId,
          siteId,
        })),
      })
    })

    return success({})
  } catch (error) {
    return handleServerActionError(error)
  }
}
