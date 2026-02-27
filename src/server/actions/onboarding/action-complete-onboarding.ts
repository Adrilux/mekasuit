"use server"

import { headers } from "next/headers"
import { auth } from "@/lib/auth/better-auth-server-config"
import { prisma } from "@/lib/db/prisma-client-singleton"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { ValidationError } from "@/lib/errors/app-error-classes"

// Appelée depuis /onboarding après que l'utilisateur a confirmé son email.
// Cherche un TenantUser inactif correspondant à son email et l'active.
// Le flow d'invitation stocke temporairement l'email comme authUserId avec isActive: false.
// Ici on remplace ce placeholder par le vrai authUserId Better Auth.
export async function actionCompleteOnboarding() {
  try {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session?.user) {
      throw new ValidationError("Non authentifié")
    }

    const authUserId = session.user.id
    const email = session.user.email

    // Vérifie s'il n'est pas déjà lié à un tenant actif
    const existing = await prisma.tenantUser.findUnique({
      where: { authUserId },
    })
    if (existing && existing.isActive) {
      return success({ alreadyLinked: true, tenantId: existing.tenantId })
    }

    // Cherche un TenantUser inactif dont authUserId vaut l'email de l'utilisateur
    // (créé par action-invite-user lorsque l'utilisateur n'existait pas encore dans Better Auth)
    const pendingByEmail = await prisma.tenantUser.findFirst({
      where: {
        authUserId: email, // stocké comme email lors de l'invitation
        isActive: false,
      },
    })

    if (!pendingByEmail) {
      return {
        success: false as const,
        error:
          "Aucune invitation en attente pour cet email. Demandez à votre administrateur de vous inviter avec l'adresse : " +
          email,
        code: "NO_INVITATION",
      }
    }

    // Active le TenantUser avec le vrai authUserId Better Auth
    await prisma.tenantUser.update({
      where: { id: pendingByEmail.id },
      data: {
        authUserId,
        isActive: true,
      },
    })

    return success({ alreadyLinked: false, tenantId: pendingByEmail.tenantId })
  } catch (error) {
    return handleServerActionError(error)
  }
}
