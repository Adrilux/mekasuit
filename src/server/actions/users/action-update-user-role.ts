"use server"

import { z } from "zod"
import { UserRole } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { prisma } from "@/lib/db/prisma-client-singleton"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError, ValidationError } from "@/lib/errors/app-error-classes"

// Accepte soit un rôle système ("workshop_manager" etc.) soit un rôle custom ("custom:clxxx")
const schema = z.object({
  tenantUserId: z.string().min(1),
  roleValue: z.string().min(1),
})

export async function actionUpdateUserRole(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session.role, "user:update-role")

    const { tenantUserId, roleValue } = schema.parse(input)

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

    if (roleValue.startsWith("custom:")) {
      // Rôle custom — vérifie appartenance au tenant
      const tenantRoleId = roleValue.slice(7)
      const tenantRole = await prisma.tenantRole.findUnique({
        where: { id: tenantRoleId },
        select: { tenantId: true },
      })
      if (!tenantRole || tenantRole.tenantId !== session.tenantId) {
        throw new NotFoundError("Rôle custom", tenantRoleId)
      }
      await prisma.tenantUser.update({
        where: { id: tenantUserId },
        data: { tenantRoleId },
      })
    } else {
      // Rôle système — efface le rôle custom éventuel
      const validSystemRoles: UserRole[] = ["client_admin", "workshop_manager", "technician", "reader"]
      if (!validSystemRoles.includes(roleValue as UserRole)) {
        throw new ValidationError("Rôle système invalide")
      }
      await prisma.tenantUser.update({
        where: { id: tenantUserId },
        data: { role: roleValue as UserRole, tenantRoleId: null },
      })
    }

    return success(undefined)
  } catch (error) {
    return handleServerActionError(error)
  }
}
