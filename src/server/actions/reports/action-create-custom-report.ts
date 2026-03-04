"use server"

import { z } from "zod"
import { Prisma, ModuleName } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { assertModuleActive } from "@/lib/modules/module-access-checker"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"

const schema = z.object({
  name: z.string().min(1).max(100),
  columns: z.array(z.string().min(1)).min(1, "Au moins une colonne requise"),
  filters: z.object({
    siteId: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    type: z.string().optional(),
    priority: z.string().optional(),
  }),
})

export async function actionCreateCustomReport(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session, "report:read")
    await assertModuleActive(session.tenantId, ModuleName.ADVANCED_REPORTS)

    const data = schema.parse(input)

    const result = await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      return tx.customReport.create({
        data: {
          tenantId: session.tenantId,
          createdBy: session.id,
          name: data.name,
          columns: data.columns,
          filters: data.filters,
        },
        select: { id: true },
      })
    })

    return success(result)
  } catch (error) {
    return handleServerActionError(error)
  }
}
