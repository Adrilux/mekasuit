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
})

export async function actionDeleteCustomReport(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session, "report:read")
    await assertModuleActive(session.tenantId, ModuleName.ADVANCED_REPORTS)

    const { id } = schema.parse(input)

    await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      const report = await tx.customReport.findUnique({ where: { id }, select: { tenantId: true } })
      if (!report) throw new Error("Rapport introuvable")

      await tx.customReport.delete({ where: { id } })
    })

    return success(null)
  } catch (error) {
    return handleServerActionError(error)
  }
}
