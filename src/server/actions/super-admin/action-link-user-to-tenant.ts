"use server"

import { z } from "zod"
import { UserRole } from "@prisma/client"
import { requireSuperAdmin } from "@/lib/auth/auth-session-helpers"
import { prisma } from "@/lib/db/prisma-client-singleton"
import { auth } from "@/lib/auth/better-auth-server-config"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { ValidationError } from "@/lib/errors/app-error-classes"
import { logger } from "@/lib/errors/error-logger"

const schema = z.object({
  tenantId: z.string().min(1),
  userEmail: z.string().email(),
  userName: z.string().min(2).optional(),
  role: z.nativeEnum(UserRole).exclude(["super_admin"]),
})

function generateTempPassword(): string {
  const upper = Math.random().toString(36).slice(2, 6).toUpperCase()
  const lower = Math.random().toString(36).slice(2, 6)
  return upper + lower
}

export async function actionLinkUserToTenant(input: unknown) {
  try {
    await requireSuperAdmin()

    const { tenantId, userEmail, userName, role } = schema.parse(input)

    // Vérifie si un utilisateur Better Auth avec cet email existe déjà
    const existingUsers = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "user" WHERE email = ${userEmail} LIMIT 1
    `
    const existingUser = existingUsers[0] ?? null

    // Vérifie si déjà lié à un tenant
    if (existingUser) {
      const existing = await prisma.tenantUser.findFirst({
        where: { tenantId, authUserId: existingUser.id },
      })
      if (existing) {
        throw new ValidationError("Cet utilisateur est déjà lié à ce tenant")
      }
    }

    let authUserId: string
    let tempPassword: string | null = null
    let accountCreated = false

    if (existingUser) {
      // Compte existant — lien direct
      authUserId = existingUser.id
    } else {
      // Pas de compte — création automatique avec mot de passe temporaire
      const name = userName ?? userEmail.split("@")[0]
      tempPassword = generateTempPassword()

      const authResult = await auth.api.signUpEmail({
        body: { email: userEmail, password: tempPassword, name },
      })

      if (!authResult?.user?.id) {
        throw new Error("Échec de la création du compte utilisateur")
      }

      authUserId = authResult.user.id
      accountCreated = true

      // Marque le compte comme devant changer le mot de passe
      await prisma.$executeRaw`
        UPDATE "user" SET "mustChangePassword" = true WHERE id = ${authUserId}
      `
    }

    await prisma.tenantUser.create({
      data: {
        tenantId,
        authUserId,
        role,
        isActive: true,
      },
    })

    logger.info("Utilisateur lié au tenant", {
      email: userEmail,
      role,
      tenantId,
      accountCreated,
    })

    if (accountCreated && tempPassword) {
      return success({
        status: "created" as const,
        email: userEmail,
        tempPassword,
        message: `Compte créé et lié au tenant. Communiquez l'email et le mot de passe temporaire à l'utilisateur.`,
      })
    }

    return success({
      status: "linked" as const,
      message: `Utilisateur existant lié au tenant.`,
    })
  } catch (error) {
    return handleServerActionError(error)
  }
}
