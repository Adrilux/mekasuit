"use server"

import { z } from "zod"
import { requireSuperAdmin } from "@/lib/auth/auth-session-helpers"
import { prisma } from "@/lib/db/prisma-client-singleton"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { ValidationError } from "@/lib/errors/app-error-classes"

const schema = z.object({
  tenantId: z.string().min(1),
  name: z.string().min(2).max(100),
  address: z.string().optional(),
})

export async function actionCreateSite(input: unknown) {
  try {
    await requireSuperAdmin()

    const { tenantId, name, address } = schema.parse(input)

    const [license, siteCount] = await Promise.all([
      prisma.license.findUnique({ where: { tenantId } }),
      prisma.site.count({ where: { tenantId } }),
    ])

    if (license && siteCount >= license.maxSites) {
      throw new ValidationError(
        `Limite de ${license.maxSites} site(s) atteinte pour ce tenant`
      )
    }

    const site = await prisma.site.create({
      data: {
        tenantId,
        name,
        address,
        isActive: true,
      },
    })

    return success({ site })
  } catch (error) {
    return handleServerActionError(error)
  }
}
