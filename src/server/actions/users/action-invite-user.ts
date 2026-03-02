"use server"

import { z } from "zod"
import { UserRole } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { assertCanAddUser } from "@/lib/license/license-limits-checker"
import { auth } from "@/lib/auth/better-auth-server-config"
import { prisma } from "@/lib/db/prisma-client-singleton"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { ValidationError } from "@/lib/errors/app-error-classes"
import { logger } from "@/lib/errors/error-logger"
import { sendEmail } from "@/lib/email/email-sender"
import { buildInviteUserEmail } from "@/lib/email/templates/email-invite-user"
import { serverEnv } from "@/lib/env/env-server-schema"

const schema = z.object({
  name: z.string().min(2, "Nom trop court").max(100),
  email: z.string().email("Email invalide"),
  role: z.nativeEnum(UserRole).exclude(["super_admin"]),
  siteIds: z.array(z.string()).min(1, "Assignez au moins un site"),
})

function generateTempPassword(): string {
  const upper = Math.random().toString(36).slice(2, 6).toUpperCase()
  const lower = Math.random().toString(36).slice(2, 6)
  return upper + lower
}

export async function actionInviteUser(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session.role, "user:invite")
    await assertCanAddUser(session.tenantId)

    const data = schema.parse(input)

    // Un workshop_manager ne peut inviter que des techniciens et des lecteurs
    if (
      session.role === "workshop_manager" &&
      !["technician", "reader"].includes(data.role)
    ) {
      throw new ValidationError("Vous ne pouvez inviter que des techniciens ou des lecteurs")
    }

    // Vérifie si un utilisateur Better Auth avec cet email existe déjà
    const existingBetterAuthUsers = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "user" WHERE email = ${data.email} LIMIT 1
    `
    const existingBetterAuthUser = existingBetterAuthUsers[0] ?? null

    // Vérifie si déjà membre actif du tenant
    if (existingBetterAuthUser) {
      const existingActiveMember = await prisma.tenantUser.findFirst({
        where: {
          tenantId: session.tenantId,
          authUserId: existingBetterAuthUser.id,
          isActive: true,
        },
      })
      if (existingActiveMember) {
        throw new ValidationError("Cet utilisateur est déjà membre de votre organisation")
      }
    }

    let authUserId: string
    let tempPassword: string | null = null
    let accountCreated = false

    if (existingBetterAuthUser) {
      // Compte existant — lien direct
      authUserId = existingBetterAuthUser.id
    } else {
      // Pas de compte — création automatique avec mot de passe temporaire
      tempPassword = generateTempPassword()

      const authResult = await auth.api.signUpEmail({
        body: { email: data.email, password: tempPassword, name: data.name },
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

    await prisma.$transaction(async (tx) => {
      const tenantUser = await tx.tenantUser.create({
        data: {
          tenantId: session.tenantId,
          authUserId,
          role: data.role,
          isActive: true,
        },
      })

      await tx.userSite.createMany({
        data: data.siteIds.map((siteId) => ({
          tenantId: session.tenantId,
          tenantUserId: tenantUser.id,
          siteId,
        })),
      })
    })

    logger.info("Utilisateur invité", {
      email: data.email,
      role: data.role,
      tenantId: session.tenantId,
      accountCreated,
    })

    // Envoi de l'email d'invitation si un nouveau compte a été créé — best-effort
    if (accountCreated && tempPassword) {
      void (async () => {
        const tenant = await prisma.tenant.findUnique({
          where: { id: session.tenantId },
          select: { name: true },
        })
        const html = buildInviteUserEmail({
          recipientName: data.name,
          recipientEmail: data.email,
          tempPassword,
          tenantName: tenant?.name ?? "votre organisation",
          appUrl: serverEnv.BETTER_AUTH_URL,
        })
        await sendEmail({
          to: data.email,
          subject: `Invitation MekaSuite — ${tenant?.name ?? "votre organisation"}`,
          html,
        })
      })()

      return success({
        status: "created" as const,
        email: data.email,
        tempPassword,
        message: `Compte créé pour ${data.email}. Les identifiants ont été envoyés par email.`,
      })
    }

    return success({
      status: "linked" as const,
      message: `${data.email} a été ajouté directement à votre organisation.`,
    })
  } catch (error) {
    return handleServerActionError(error)
  }
}
