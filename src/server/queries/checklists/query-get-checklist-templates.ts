import { Prisma } from "@prisma/client"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import type { SessionUser } from "@/lib/auth/auth-session-helpers"

export async function queryGetChecklistTemplates(session: SessionUser) {
  return withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    return tx.checklistTemplate.findMany({
      orderBy: { name: "asc" },
      include: {
        items: { orderBy: { position: "asc" } },
      },
    })
  })
}

export type ChecklistTemplate = Awaited<ReturnType<typeof queryGetChecklistTemplates>>[number]
