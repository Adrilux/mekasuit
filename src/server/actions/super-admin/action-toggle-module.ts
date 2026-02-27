"use server"

import { z } from "zod"
import { ModuleName } from "@prisma/client"
import { requireSuperAdmin } from "@/lib/auth/auth-session-helpers"
import { prisma } from "@/lib/db/prisma-client-singleton"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { ValidationError } from "@/lib/errors/app-error-classes"
import { revalidatePath } from "next/cache"

const schema = z.object({
  tenantId: z.string().min(1),
  module: z.nativeEnum(ModuleName),
  activate: z.boolean(),
})

export async function actionToggleModule(input: unknown) {
  try {
    await requireSuperAdmin()

    const { tenantId, module, activate } = schema.parse(input)

    // Le module GMAO est le noyau et ne peut pas être désactivé
    if (module === ModuleName.GMAO && !activate) {
      throw new ValidationError("Le module GMAO est le noyau de l'application et ne peut pas être désactivé")
    }

    await prisma.tenantModule.upsert({
      where: { tenantId_module: { tenantId, module } },
      update: {
        isActive: activate,
        activatedAt: activate ? new Date() : null,
      },
      create: {
        tenantId,
        module,
        isActive: activate,
        activatedAt: activate ? new Date() : null,
      },
    })

    // Invalide le cache des modules pour que les changements soient visibles
    revalidatePath("/", "layout")

    return success(undefined)
  } catch (error) {
    return handleServerActionError(error)
  }
}
