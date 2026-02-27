"use server"

import { z } from "zod"
import { Prisma } from "@prisma/client"
import { auth } from "@/lib/auth/better-auth-server-config"
import { prisma } from "@/lib/db/prisma-client-singleton"
import { ModuleName } from "@prisma/client"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { logger } from "@/lib/errors/error-logger"

const registerSchema = z.object({
  companyName: z.string().min(2, "Nom d'entreprise trop court").max(100),
  adminName: z.string().min(2, "Nom trop court").max(100),
  adminEmail: z.string().email("Email invalide"),
  adminPassword: z.string().min(8, "Mot de passe trop court (8 caractères minimum)"),
})

// Crée un tenant, un compte admin Better Auth, et initialise la licence de base
// Tout dans une transaction — si l'une étape échoue, rien n'est créé
export async function actionRegisterTenant(input: unknown) {
  try {
    // 1. Validation de l'input
    const data = registerSchema.parse(input)

    // 2. Crée le slug à partir du nom d'entreprise
    const slug = data.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")

    // 3. Crée l'utilisateur Better Auth en dehors de la transaction Prisma
    //    (Better Auth gère sa propre DB via l'adapteur)
    const authResult = await auth.api.signUpEmail({
      body: {
        email: data.adminEmail,
        password: data.adminPassword,
        name: data.adminName,
      },
    })

    if (!authResult?.user?.id) {
      throw new Error("Échec de la création du compte utilisateur")
    }

    const authUserId = authResult.user.id

    // 4. Crée le tenant, la licence, les modules de base et le profil utilisateur
    //    Tout dans une transaction Prisma
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Crée le tenant
      const tenant = await tx.tenant.create({
        data: {
          name: data.companyName,
          slug: `${slug}-${Date.now()}`, // suffixe pour garantir l'unicité
        },
      })

      // Licence de base : 1 site, 5 utilisateurs
      await tx.license.create({
        data: {
          tenantId: tenant.id,
          maxSites: 1,
          maxUsers: 5,
          renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours d'essai
        },
      })

      // Active GMAO par défaut (toujours actif)
      await tx.tenantModule.create({
        data: {
          tenantId: tenant.id,
          module: ModuleName.GMAO,
          isActive: true,
          activatedAt: new Date(),
        },
      })

      // Crée le profil utilisateur lié au tenant avec le rôle client_admin
      await tx.tenantUser.create({
        data: {
          tenantId: tenant.id,
          authUserId,
          role: "client_admin",
        },
      })

      logger.info("Nouveau tenant créé", { tenantId: tenant.id, slug: tenant.slug })
    })

    return success(undefined)
  } catch (error) {
    return handleServerActionError(error)
  }
}
