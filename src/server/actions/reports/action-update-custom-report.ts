"use server"

import { z } from "zod"
import { Prisma, ModuleName } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { assertModuleActive } from "@/lib/modules/module-access-checker"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"

const schema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
  columns: z.array(z.string().min(1)).min(1).optional(),
  filters: z
    .object({
      siteId: z.string().optional(),
      from: z.string().optional(),
      to: z.string().optional(),
      type: z.string().optional(),
      priority: z.string().optional(),
    })
    .optional(),
})

export async function actionUpdateCustomReport(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session.role, "report:read")
    await assertModuleActive(session.tenantId, ModuleName.ADVANCED_REPORTS)

    const { id, ...data } = schema.parse(input)

    const result = await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      const existing = await tx.customReport.findUnique({ where: { id }, select: { tenantId: true } })
      if (!existing) throw new Error("Rapport introuvable")

      return tx.customReport.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.columns !== undefined && { columns: data.columns }),
          ...(data.filters !== undefined && { filters: data.filters }),
        },
        select: { id: true },
      })
    })

    return success(result)
  } catch (error) {
    return handleServerActionError(error)
  }
}
