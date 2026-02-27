import { Prisma } from "@prisma/client"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import type { SessionUser } from "@/lib/auth/auth-session-helpers"

export async function queryGetMyInterventionsToday(session: SessionUser) {
  // "Today" = today 00:00 to tomorrow 00:00
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const tomorrowStart = new Date(todayStart)
  tomorrowStart.setDate(tomorrowStart.getDate() + 1)

  return withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    return tx.intervention.findMany({
      where: {
        assignedUserId: session.id,
        status: { in: ["OPEN", "IN_PROGRESS", "PENDING_PARTS"] },
        OR: [
          // Planifiée aujourd'hui
          { scheduledAt: { gte: todayStart, lt: tomorrowStart } },
          // En retard (planifiée dans le passé et encore ouverte)
          { scheduledAt: { lt: todayStart } },
          // Non planifiée mais en cours (IN_PROGRESS)
          { status: "IN_PROGRESS" },
        ],
      },
      orderBy: [
        { priority: "desc" },
        { scheduledAt: "asc" },
        { createdAt: "asc" },
      ],
      select: {
        id: true,
        title: true,
        type: true,
        priority: true,
        status: true,
        scheduledAt: true,
        machine: { select: { id: true, name: true } },
        site: { select: { name: true } },
      },
    })
  })
}

export type TodayInterventionItem = Awaited<ReturnType<typeof queryGetMyInterventionsToday>>[number]
