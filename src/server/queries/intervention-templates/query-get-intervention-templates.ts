import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { Prisma } from "@prisma/client"
import type { SessionUser } from "@/lib/auth/auth-session-helpers"

export type InterventionTemplate = {
  id: string
  name: string
  description: string | null
  type: string
  priority: string
  checklistItems: { id: string; label: string; isRequired: boolean; position: number }[]
}

export async function queryGetInterventionTemplates(session: SessionUser): Promise<InterventionTemplate[]> {
  return withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    return tx.interventionTemplate.findMany({
      where: { tenantId: session.tenantId },
      include: {
        checklistItems: { orderBy: { position: "asc" } },
      },
      orderBy: { name: "asc" },
    })
  })
}
