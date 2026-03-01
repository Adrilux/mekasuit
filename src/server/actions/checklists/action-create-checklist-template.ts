"use server"

import { z } from "zod"
import { Prisma } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"

const schema = z.object({
  name: z.string().min(1, "Nom requis").max(200),
  items: z.array(z.object({
    label: z.string().min(1).max(500),
    isRequired: z.boolean().default(false),
  })).min(1, "Au moins un item requis"),
})

export async function actionCreateChecklistTemplate(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session.role, "intervention:update")

    const data = schema.parse(input)

    const result = await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      return tx.checklistTemplate.create({
        data: {
          tenantId: session.tenantId,
          name: data.name,
          items: {
            create: data.items.map((item, idx) => ({
              tenantId: session.tenantId,
              label: item.label,
              isRequired: item.isRequired,
              position: idx,
            })),
          },
        },
        include: { items: { orderBy: { position: "asc" } } },
      })
    })

    return success(result)
  } catch (error) {
    return handleServerActionError(error)
  }
}
