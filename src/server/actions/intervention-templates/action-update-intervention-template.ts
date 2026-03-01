"use server"

import { z } from "zod"
import { Prisma, InterventionType, InterventionPriority } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError } from "@/lib/errors/app-error-classes"

const schema = z.object({
  templateId: z.string().min(1),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  type: z.nativeEnum(InterventionType),
  priority: z.nativeEnum(InterventionPriority),
  checklistItems: z.array(z.object({
    label: z.string().min(1),
    isRequired: z.boolean().default(false),
  })).default([]),
})

export async function actionUpdateInterventionTemplate(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session.role, "intervention:update")

    const data = schema.parse(input)

    const result = await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      const existing = await tx.interventionTemplate.findUnique({ where: { id: data.templateId } })
      if (!existing) throw new NotFoundError("Modèle", data.templateId)

      // Supprimer les anciens items et recréer
      await tx.interventionTemplateChecklistItem.deleteMany({ where: { templateId: data.templateId } })

      const template = await tx.interventionTemplate.update({
        where: { id: data.templateId },
        data: {
          name: data.name,
          description: data.description || null,
          type: data.type,
          priority: data.priority,
          checklistItems: {
            create: data.checklistItems.map((item, idx) => ({
              tenantId: session.tenantId,
              label: item.label,
              isRequired: item.isRequired,
              position: idx,
            })),
          },
        },
        include: { checklistItems: { orderBy: { position: "asc" } } },
      })
      return template
    })

    return success(result)
  } catch (error) {
    return handleServerActionError(error)
  }
}
