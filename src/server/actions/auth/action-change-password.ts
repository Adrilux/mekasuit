"use server"

import { z } from "zod"
import { headers } from "next/headers"
import { auth } from "@/lib/auth/better-auth-server-config"
import { prisma } from "@/lib/db/prisma-client-singleton"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { AuthError } from "@/lib/errors/app-error-classes"

const schema = z.object({
  currentPassword: z.string().min(1, "Mot de passe actuel requis"),
  newPassword: z.string().min(8, "Le nouveau mot de passe doit contenir au moins 8 caractères"),
  confirmPassword: z.string().min(8),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
})

export async function actionChangePassword(input: unknown) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) throw new AuthError()

    const { currentPassword, newPassword } = schema.parse(input)

    // Better Auth change password — vérifie l'ancien mot de passe
    await auth.api.changePassword({
      body: { currentPassword, newPassword, revokeOtherSessions: false },
      headers: await headers(),
    })

    // Efface le flag mustChangePassword
    await prisma.$executeRaw`
      UPDATE "user" SET "mustChangePassword" = false WHERE id = ${session.user.id}
    `

    return success({ message: "Mot de passe changé avec succès" })
  } catch (error) {
    return handleServerActionError(error)
  }
}
