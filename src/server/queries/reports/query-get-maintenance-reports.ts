import { Prisma } from "@prisma/client"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import type { SessionUser } from "@/lib/auth/auth-session-helpers"

export type ReportFilter = {
  siteId: string
  from?: Date
  to?: Date
}

// ============================================================
// MTBF — Mean Time Between Failures
// Pour chaque machine: temps moyen entre interventions CORRECTIVE CLOSED
// ============================================================
export async function queryGetMtbfBySite(session: SessionUser, filter: ReportFilter) {
  return withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    const machines = await tx.machine.findMany({
      where: { siteId: filter.siteId },
      select: {
        id: true,
        name: true,
        interventions: {
          where: {
            type: "CORRECTIVE",
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
          orderBy: { closedAt: "asc" },
          select: { closedAt: true, createdAt: true },
        },
      },
    })

    return machines
      .map((machine) => {
        const closedDates = machine.interventions
          .map((i) => i.closedAt)
          .filter((d): d is Date => d !== null)
          .sort((a, b) => a.getTime() - b.getTime())

        let mtbfHours: number | null = null
        if (closedDates.length >= 2) {
          const gaps: number[] = []
          for (let i = 1; i < closedDates.length; i++) {
            gaps.push((closedDates[i].getTime() - closedDates[i - 1].getTime()) / (1000 * 3600))
          }
          mtbfHours = gaps.reduce((sum, g) => sum + g, 0) / gaps.length
        }

        return {
          machineId: machine.id,
          machineName: machine.name,
          interventionCount: closedDates.length,
          mtbfHours,
        }
      })
      .filter((m) => m.interventionCount > 0)
      .sort((a, b) => {
        // Null (insuffisant) en bas, puis croissant (machines en problème = MTBF faible en haut)
        if (a.mtbfHours === null) return 1
        if (b.mtbfHours === null) return -1
        return a.mtbfHours - b.mtbfHours
      })
  })
}

// ============================================================
// Charge technicien — nb interventions par technicien assigné
// ============================================================
export async function queryGetTechnicianLoad(session: SessionUser, filter: ReportFilter) {
  return withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    const interventions = await tx.intervention.findMany({
      where: {
        siteId: filter.siteId,
        assignedUserId: { not: null },
        ...(filter.from || filter.to
          ? {
              createdAt: {
                ...(filter.from ? { gte: filter.from } : {}),
                ...(filter.to ? { lte: filter.to } : {}),
              },
            }
          : {}),
      },
      select: {
        assignedUserId: true,
        status: true,
        type: true,
        priority: true,
      },
    })

    // Group by assignedUserId
    const map = new Map<
      string,
      { total: number; open: number; closed: number; corrective: number; preventive: number; critical: number }
    >()

    for (const i of interventions) {
      if (!i.assignedUserId) continue
      const entry = map.get(i.assignedUserId) ?? {
        total: 0, open: 0, closed: 0, corrective: 0, preventive: 0, critical: 0,
      }
      entry.total++
      if (["CLOSED", "CANCELLED"].includes(i.status)) entry.closed++
      else entry.open++
      if (i.type === "CORRECTIVE") entry.corrective++
      if (i.type === "PREVENTIVE") entry.preventive++
      if (i.priority === "CRITICAL") entry.critical++
      map.set(i.assignedUserId, entry)
    }

    return Array.from(map.entries()).map(([userId, stats]) => ({ userId, ...stats }))
  })
}

// ============================================================
// Coût maintenance — coût total par machine (pièces consommées)
// ============================================================
export async function queryGetMaintenanceCostBySite(session: SessionUser, filter: ReportFilter) {
  return withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    const partsUsed = await tx.interventionPartUsed.findMany({
      where: {
        intervention: {
          siteId: filter.siteId,
          ...(filter.from || filter.to
            ? {
                createdAt: {
                  ...(filter.from ? { gte: filter.from } : {}),
                  ...(filter.to ? { lte: filter.to } : {}),
                },
              }
            : {}),
        },
      },
      select: {
        quantity: true,
        stockItem: { select: { unitCostCents: true } },
        intervention: {
          select: {
            machineId: true,
            machine: { select: { name: true } },
          },
        },
      },
    })

    // Group by machineId
    const map = new Map<string, { machineName: string; totalCostCents: number; partsConsumed: number }>()

    for (const part of partsUsed) {
      const machineId = part.intervention.machineId ?? "unknown"
      const machineName = part.intervention.machine?.name ?? "Inconnue"
      const costCents = part.quantity * part.stockItem.unitCostCents
      const entry = map.get(machineId) ?? { machineName, totalCostCents: 0, partsConsumed: 0 }
      entry.totalCostCents += costCents
      entry.partsConsumed += part.quantity
      map.set(machineId, entry)
    }

    return Array.from(map.entries())
      .map(([machineId, stats]) => ({ machineId, ...stats }))
      .sort((a, b) => b.totalCostCents - a.totalCostCents)
  })
}

export type MtbfRow = Awaited<ReturnType<typeof queryGetMtbfBySite>>[number]
export type TechLoadRow = Awaited<ReturnType<typeof queryGetTechnicianLoad>>[number]
export type CostRow = Awaited<ReturnType<typeof queryGetMaintenanceCostBySite>>[number]
