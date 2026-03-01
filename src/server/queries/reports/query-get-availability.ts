import { Prisma } from "@prisma/client"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import type { SessionUser } from "@/lib/auth/auth-session-helpers"
import type { ReportFilter } from "./query-get-maintenance-reports"

export type AvailabilityRow = {
  machineId: string
  machineName: string
  incidentCount: number
  downtimeHours: number
  availabilityRate: number // 0–100
}

// Disponibilité = 1 - (cumul durées pannes correctives / durée période)
// Machine "indisponible" = de createdAt à closedAt d'une intervention CORRECTIVE CLOSED
export async function queryGetAvailability(
  session: SessionUser,
  filter: ReportFilter,
): Promise<AvailabilityRow[]> {
  const now = new Date()
  const periodFrom = filter.from ?? new Date(now.getTime() - 90 * 24 * 3600 * 1000)
  const periodTo = filter.to ?? now
  const totalPeriodHours = (periodTo.getTime() - periodFrom.getTime()) / (1000 * 3600)

  if (totalPeriodHours <= 0) return []

  return withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    const machines = await tx.machine.findMany({
      where: { siteId: filter.siteId, status: { not: "DECOMMISSIONED" } },
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
          select: { createdAt: true, closedAt: true },
        },
      },
    })

    return machines
      .map((machine) => {
        const interventions = machine.interventions.filter((i) => i.closedAt !== null)
        if (interventions.length === 0) return null

        const downtimeHours = interventions.reduce((sum, i) => {
          const start = Math.max(i.createdAt.getTime(), periodFrom.getTime())
          const end = Math.min(i.closedAt!.getTime(), periodTo.getTime())
          const hours = Math.max(0, (end - start) / (1000 * 3600))
          return sum + hours
        }, 0)

        const cappedDowntime = Math.min(downtimeHours, totalPeriodHours)
        const availabilityRate = ((totalPeriodHours - cappedDowntime) / totalPeriodHours) * 100

        return {
          machineId: machine.id,
          machineName: machine.name,
          incidentCount: interventions.length,
          downtimeHours: Math.round(cappedDowntime * 10) / 10,
          availabilityRate: Math.round(availabilityRate * 10) / 10,
        }
      })
      .filter((r): r is AvailabilityRow => r !== null)
      .sort((a, b) => a.availabilityRate - b.availabilityRate)
  })
}
