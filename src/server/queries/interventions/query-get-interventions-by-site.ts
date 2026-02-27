import { Prisma, InterventionStatus, InterventionType, InterventionPriority } from "@prisma/client"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import type { SessionUser } from "@/lib/auth/auth-session-helpers"

type Filter = {
  siteId: string
  status?: InterventionStatus
  type?: InterventionType
  priority?: InterventionPriority
  assignedUserId?: string
  search?: string
}

export async function queryGetInterventionsBySite(session: SessionUser, filter: Filter) {
  return withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    return tx.intervention.findMany({
      where: {
        siteId: filter.siteId,
        ...(filter.status ? { status: filter.status } : {}),
        ...(filter.type ? { type: filter.type } : {}),
        ...(filter.priority ? { priority: filter.priority } : {}),
        ...(filter.assignedUserId ? { assignedUserId: filter.assignedUserId } : {}),
        ...(filter.search
          ? { title: { contains: filter.search, mode: "insensitive" } }
          : {}),
      },
      orderBy: [
        // Critiques en premier, puis par date
        { priority: "desc" },
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        title: true,
        type: true,
        priority: true,
        status: true,
        assignedUserId: true,
        scheduledAt: true,
        createdAt: true,
        closedAt: true,
        machine: { select: { id: true, name: true } },
      },
    })
  })
}

export type InterventionListItem = Awaited<ReturnType<typeof queryGetInterventionsBySite>>[number]
