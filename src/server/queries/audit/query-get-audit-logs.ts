import { Prisma } from "@prisma/client"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import type { SessionUser } from "@/lib/auth/auth-session-helpers"

type Filter = {
  entityType?: string
  userId?: string
  from?: Date
  to?: Date
  limit?: number
}

export async function queryGetAuditLogs(session: SessionUser, filter: Filter = {}) {
  return withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    return tx.auditLog.findMany({
      where: {
        ...(filter.entityType ? { entityType: filter.entityType } : {}),
        ...(filter.userId ? { userId: filter.userId } : {}),
        ...(filter.from || filter.to
          ? {
              createdAt: {
                ...(filter.from ? { gte: filter.from } : {}),
                ...(filter.to ? { lte: filter.to } : {}),
              },
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: filter.limit ?? 100,
    })
  })
}

export type AuditLogItem = Awaited<ReturnType<typeof queryGetAuditLogs>>[number]
