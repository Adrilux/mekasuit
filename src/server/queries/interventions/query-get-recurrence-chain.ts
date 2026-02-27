import { Prisma } from "@prisma/client"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import type { SessionUser } from "@/lib/auth/auth-session-helpers"

type ChainItem = {
  id: string
  title: string
  status: string
  scheduledAt: Date | null
  closedAt: Date | null
  createdAt: Date
}

/**
 * Returns the full recurrence chain for a preventive intervention.
 * Walks up to the root (parentInterventionId = null) then fetches all descendants.
 * Limited to 50 items to prevent abuse.
 */
export async function queryGetRecurrenceChain(
  session: SessionUser,
  interventionId: string,
): Promise<ChainItem[]> {
  return withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    // Walk up to find the root of the chain
    let rootId = interventionId
    let current = await tx.intervention.findUnique({
      where: { id: interventionId },
      select: { parentInterventionId: true, recurrenceType: true },
    })
    if (!current?.recurrenceType) return [] // Not a recurring intervention

    // Traverse up (max 100 iterations safety)
    for (let i = 0; i < 100 && current?.parentInterventionId; i++) {
      rootId = current.parentInterventionId
      current = await tx.intervention.findUnique({
        where: { id: rootId },
        select: { parentInterventionId: true, recurrenceType: true },
      })
    }

    // Fetch all descendants of root (BFS via multiple queries, limited)
    const chain: ChainItem[] = []
    const queue = [rootId]
    const visited = new Set<string>()

    while (queue.length > 0 && chain.length < 50) {
      const batchIds = queue.splice(0, 10)
      const items = await tx.intervention.findMany({
        where: { id: { in: batchIds.filter((id) => !visited.has(id)) } },
        select: {
          id: true,
          title: true,
          status: true,
          scheduledAt: true,
          closedAt: true,
          createdAt: true,
        },
      })
      for (const item of items) {
        visited.add(item.id)
        chain.push(item)
      }
      // Find children of these items
      const children = await tx.intervention.findMany({
        where: { parentInterventionId: { in: batchIds }, id: { notIn: [...visited] } },
        select: { id: true },
        take: 50,
      })
      for (const child of children) {
        if (!visited.has(child.id)) queue.push(child.id)
      }
    }

    return chain.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  })
}
