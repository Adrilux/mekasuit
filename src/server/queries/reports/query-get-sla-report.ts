import { Prisma } from "@prisma/client"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import type { SessionUser } from "@/lib/auth/auth-session-helpers"
import type { ReportFilter } from "./query-get-maintenance-reports"

// Délais SLA fixes par priorité (en heures)
export const SLA_LIMITS: Record<string, number> = {
  CRITICAL: 4,
  HIGH: 24,
  MEDIUM: 72,
  LOW: 168,
}

export const PRIORITY_LABELS: Record<string, string> = {
  CRITICAL: "Critique",
  HIGH: "Haute",
  MEDIUM: "Moyenne",
  LOW: "Basse",
}

export type SlaRow = {
  priority: string
  priorityLabel: string
  slaLimitHours: number
  total: number
  withinSla: number
  slaRate: number // 0–100
  avgResponseHours: number
}

export async function queryGetSlaReport(
  session: SessionUser,
  filter: ReportFilter,
): Promise<SlaRow[]> {
  return withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    const interventions = await tx.intervention.findMany({
      where: {
        siteId: filter.siteId,
        status: "CLOSED",
        closedAt: { not: null },
        ...(filter.from || filter.to
          ? {
              closedAt: {
                ...(filter.from ? { gte: filter.from } : {}),
                ...(filter.to ? { lte: filter.to } : {}),
              },
            }
          : {}),
      },
      select: { priority: true, createdAt: true, closedAt: true },
    })

    // Group by priority
    const map = new Map<string, { total: number; withinSla: number; totalResponseHours: number }>()

    for (const priority of Object.keys(SLA_LIMITS)) {
      map.set(priority, { total: 0, withinSla: 0, totalResponseHours: 0 })
    }

    for (const i of interventions) {
      if (!i.closedAt) continue
      const responseHours = (i.closedAt.getTime() - i.createdAt.getTime()) / (1000 * 3600)
      const priority = i.priority
      const limit = SLA_LIMITS[priority]
      if (limit === undefined) continue

      const entry = map.get(priority) ?? { total: 0, withinSla: 0, totalResponseHours: 0 }
      entry.total++
      entry.totalResponseHours += responseHours
      if (responseHours <= limit) entry.withinSla++
      map.set(priority, entry)
    }

    const priorityOrder = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]

    return priorityOrder.map((priority) => {
      const entry = map.get(priority) ?? { total: 0, withinSla: 0, totalResponseHours: 0 }
      return {
        priority,
        priorityLabel: PRIORITY_LABELS[priority] ?? priority,
        slaLimitHours: SLA_LIMITS[priority] ?? 0,
        total: entry.total,
        withinSla: entry.withinSla,
        slaRate: entry.total > 0 ? Math.round((entry.withinSla / entry.total) * 1000) / 10 : 0,
        avgResponseHours:
          entry.total > 0 ? Math.round((entry.totalResponseHours / entry.total) * 10) / 10 : 0,
      }
    })
  })
}
