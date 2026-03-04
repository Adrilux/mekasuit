"use server"

import { z } from "zod"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { prisma } from "@/lib/db/prisma-client-singleton"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError, ValidationError } from "@/lib/errors/app-error-classes"

const schema = z.object({
  tenantUserId: z.string().min(1),
  tenantRoleId: z.string().min(1),
})

export async function actionUpdateUserRole(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session, "role:assign")

    const { tenantUserId, tenantRoleId } = schema.parse(input)

    const existing = await prisma.tenantUser.findUnique({
      where: { id: tenantUserId },
      select: { tenantId: true, role: true, authUserId: true },
    })

    if (!existing || existing.tenantId !== session.tenantId) {
      throw new NotFoundError("Utilisateur", tenantUserId)
    }

    if (existing.authUserId === session.id) {
      throw new ValidationError("Vous ne pouvez pas modifier votre propre rôle")
    }

    if (existing.role === "super_admin") {
      throw new ValidationError("Le rôle super_admin ne peut pas être modifié ici")
    }

    // Vérifie que le TenantRole appartient bien à ce tenant
    const tenantRole = await prisma.tenantRole.findUnique({
      where: { id: tenantRoleId },
      select: { tenantId: true, systemRole: true },
    })
    if (!tenantRole || tenantRole.tenantId !== session.tenantId) {
      throw new NotFoundError("Rôle", tenantRoleId)
    }

    // Garantie : au moins 1 Administrateur actif doit rester
    if (tenantRole.systemRole !== "client_admin") {
      const adminRole = await prisma.tenantRole.findFirst({
        where: { tenantId: session.tenantId, systemRole: "client_admin" },
        select: { id: true },
      })
      if (adminRole) {
        const adminCount = await prisma.tenantUser.count({
          where: { tenantId: session.tenantId, tenantRoleId: adminRole.id, isActive: true },
        })
        const isCurrentAdmin = await prisma.tenantUser.findFirst({
          where: { id: tenantUserId, tenantRoleId: adminRole.id },
        })
        if (adminCount <= 1 && isCurrentAdmin) {
          throw new ValidationError("Impossible : ce tenant doit avoir au moins un Administrateur actif")
        }
      }
    }

    await prisma.tenantUser.update({
      where: { id: tenantUserId },
      data: { tenantRoleId, role: tenantRole.systemRole ?? existing.role },
    })

    return success(undefined)
  } catch (error) {
    return handleServerActionError(error)
  }
}
