"use server"

import { z } from "zod"
import { requireSuperAdmin } from "@/lib/auth/auth-session-helpers"
import { prisma } from "@/lib/db/prisma-client-singleton"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { ValidationError } from "@/lib/errors/app-error-classes"

const schema = z.object({
  siteId: z.string().min(1),
})

export async function actionDeleteSite(input: unknown) {
  try {
    await requireSuperAdmin()

    const { siteId } = schema.parse(input)

    const site = await prisma.site.findUnique({
      where: { id: siteId },
      include: {
        _count: {
          select: {
            machines: true,
            stockItems: true,
            interventions: true,
          },
        },
      },
    })

    if (!site) {
      throw new ValidationError("Site introuvable")
    }

    if (
      site._count.machines > 0 ||
      site._count.stockItems > 0 ||
      site._count.interventions > 0
    ) {
      throw new ValidationError(
        "Impossible de supprimer un site qui contient des machines, du stock ou des interventions"
      )
    }

    await prisma.site.delete({ where: { id: siteId } })

    return success(undefined)
  } catch (error) {
    return handleServerActionError(error)
  }
}
