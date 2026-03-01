import { Prisma } from "@prisma/client"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import type { SessionUser } from "@/lib/auth/auth-session-helpers"

export type TimelineEvent =
  | {
      kind: "intervention_created"
      id: string
      date: Date
      interventionId: string
      title: string
      type: string
      priority: string
    }
  | {
      kind: "intervention_closed"
      id: string
      date: Date
      interventionId: string
      title: string
      type: string
    }
  | {
      kind: "intervention_cancelled"
      id: string
      date: Date
      interventionId: string
      title: string
    }
  | {
      kind: "audit"
      id: string
      date: Date
      action: string
      userId: string
      changes: Record<string, unknown> | null
    }

export async function queryGetMachineTimeline(
  session: SessionUser,
  machineId: string,
): Promise<TimelineEvent[]> {
  return withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    const [interventions, auditLogs] = await Promise.all([
      tx.intervention.findMany({
        where: { machineId },
        select: {
          id: true,
          title: true,
          type: true,
          priority: true,
          status: true,
          createdAt: true,
          closedAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      tx.auditLog.findMany({
        where: { entityType: "machine", entityId: machineId },
        select: {
          id: true,
          action: true,
          userId: true,
          changes: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ])

    const events: TimelineEvent[] = []

    for (const i of interventions) {
      events.push({
        kind: "intervention_created",
        id: `ic-${i.id}`,
        date: i.createdAt,
        interventionId: i.id,
        title: i.title,
        type: i.type,
        priority: i.priority,
      })
      if (i.closedAt) {
        events.push({
          kind: i.status === "CANCELLED" ? "intervention_cancelled" : "intervention_closed",
          id: `icl-${i.id}`,
          date: i.closedAt,
          interventionId: i.id,
          title: i.title,
          type: i.type,
        })
      }
    }

    for (const a of auditLogs) {
      events.push({
        kind: "audit",
        id: `al-${a.id}`,
        date: a.createdAt,
        action: a.action,
        userId: a.userId,
        changes: a.changes as Record<string, unknown> | null,
      })
    }

    // Tri décroissant (le plus récent en premier)
    events.sort((a, b) => b.date.getTime() - a.date.getTime())

    return events
  })
}
