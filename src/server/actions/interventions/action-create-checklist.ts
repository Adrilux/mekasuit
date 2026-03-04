"use server"

import { z } from "zod"
import { Prisma } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan, assertSiteAccess } from "@/lib/permissions/permission-checker-server"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError } from "@/lib/errors/app-error-classes"

const schema = z.object({
  interventionId: z.string().min(1),
  name: z.string().min(1, "Nom requis").max(200),
  // Items optionnels à créer avec la checklist
  items: z.array(z.object({
    label: z.string().min(1).max(500),
    isRequired: z.boolean().default(false),
  })).optional(),
  // Ou import depuis un modèle
  templateId: z.string().min(1).optional(),
})

export async function actionCreateChecklist(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session, "intervention:update")

    const data = schema.parse(input)

    const result = await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      const intervention = await tx.intervention.findUnique({
        where: { id: data.interventionId },
        select: { siteId: true },
      })
      if (!intervention) throw new NotFoundError("Intervention", data.interventionId)
      assertSiteAccess(session, intervention.siteId)

      // Items: soit depuis le formulaire, soit depuis un modèle
      let items: { label: string; isRequired: boolean }[] = data.items ?? []

      if (data.templateId) {
        const template = await tx.checklistTemplate.findUnique({
          where: { id: data.templateId },
          include: { items: { orderBy: { position: "asc" } } },
        })
        if (template) {
          items = template.items.map((i) => ({ label: i.label, isRequired: i.isRequired }))
        }
      }

      const checklist = await tx.interventionChecklist.create({
        data: {
          tenantId: session.tenantId,
          interventionId: data.interventionId,
          name: data.name,
          items: {
            create: items.map((item, idx) => ({
              tenantId: session.tenantId,
              label: item.label,
              isRequired: item.isRequired,
              position: idx,
            })),
          },
        },
        include: {
          items: { orderBy: { position: "asc" } },
        },
      })

      return checklist
    })

    return success(result)
  } catch (error) {
    return handleServerActionError(error)
  }
}
