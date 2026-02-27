"use server"

import { z } from "zod"
import { requireSuperAdmin } from "@/lib/auth/auth-session-helpers"
import { prisma } from "@/lib/db/prisma-client-singleton"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"

const schema = z.object({
  tenantId: z.string().min(1),
  maxSites: z.coerce.number().int().min(1).max(100),
  maxUsers: z.coerce.number().int().min(1).max(1000),
  billingPeriod: z.enum(["monthly", "yearly"]),
  renewsAt: z.string().min(1),
})

export async function actionUpdateLicense(input: unknown) {
  try {
    await requireSuperAdmin()

    const data = schema.parse(input)

    await prisma.license.upsert({
      where: { tenantId: data.tenantId },
      update: {
        maxSites: data.maxSites,
        maxUsers: data.maxUsers,
        billingPeriod: data.billingPeriod,
        renewsAt: new Date(data.renewsAt),
      },
      create: {
        tenantId: data.tenantId,
        maxSites: data.maxSites,
        maxUsers: data.maxUsers,
        billingPeriod: data.billingPeriod,
        renewsAt: new Date(data.renewsAt),
      },
    })

    return success(undefined)
  } catch (error) {
    return handleServerActionError(error)
  }
}
