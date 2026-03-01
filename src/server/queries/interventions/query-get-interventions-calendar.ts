import { Prisma } from "@prisma/client"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import type { SessionUser } from "@/lib/auth/auth-session-helpers"

export type CalendarIntervention = {
  id: string
  title: string
  type: string
  priority: string
  status: string
  assignedUserId: string | null
  scheduledAt: Date | null
  closedAt: Date | null
  machineName: string | null
}

export async function queryGetInterventionsCalendar(
  session: SessionUser,
  siteId: string,
  from: Date,
  to: Date,
): Promise<CalendarIntervention[]> {
  return withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    return tx.intervention.findMany({
      where: {
        siteId,
        status: { notIn: ["CANCELLED"] },
        OR: [
          { scheduledAt: { gte: from, lte: to } },
          { createdAt: { gte: from, lte: to } },
        ],
      },
      select: {
        id: true,
        title: true,
        type: true,
        priority: true,
        status: true,
        assignedUserId: true,
        scheduledAt: true,
        closedAt: true,
        machine: { select: { name: true } },
      },
      orderBy: { scheduledAt: "asc" },
    })
  }).then((rows) =>
    rows.map((r) => ({
      ...r,
      machineName: r.machine?.name ?? null,
    }))
  )
}
