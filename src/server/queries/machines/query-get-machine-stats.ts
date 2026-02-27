import { Prisma } from "@prisma/client"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import type { SessionUser } from "@/lib/auth/auth-session-helpers"

export type MachineStats = {
  totalInterventions: number
  openInterventions: number
  closedCorrectiveCount: number
  mtbfHours: number | null
  totalCostCents: number
  lastInterventionAt: Date | null
}

export async function queryGetMachineStats(
  session: SessionUser,
  machineId: string,
): Promise<MachineStats> {
  return withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    const [interventions, partsUsed] = await Promise.all([
      tx.intervention.findMany({
        where: { machineId },
        select: {
          status: true,
          type: true,
          closedAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      tx.interventionPartUsed.findMany({
        where: { intervention: { machineId } },
        select: {
          quantity: true,
          stockItem: { select: { unitCostCents: true } },
        },
      }),
    ])

    const totalInterventions = interventions.length
    const openInterventions = interventions.filter(
      (i) => !["CLOSED", "CANCELLED"].includes(i.status),
    ).length

    const closedDates = interventions
      .filter((i) => i.type === "CORRECTIVE" && i.closedAt !== null)
      .map((i) => i.closedAt as Date)
      .sort((a, b) => a.getTime() - b.getTime())

    const closedCorrectiveCount = closedDates.length

    let mtbfHours: number | null = null
    if (closedDates.length >= 2) {
      const gaps: number[] = []
      for (let idx = 1; idx < closedDates.length; idx++) {
        gaps.push(
          (closedDates[idx].getTime() - closedDates[idx - 1].getTime()) / (1000 * 3600),
        )
      }
      mtbfHours = Math.round(gaps.reduce((sum, g) => sum + g, 0) / gaps.length)
    }

    const totalCostCents = partsUsed.reduce(
      (sum, p) => sum + p.quantity * p.stockItem.unitCostCents,
      0,
    )

    const lastInterventionAt = interventions[0]?.createdAt ?? null

    return {
      totalInterventions,
      openInterventions,
      closedCorrectiveCount,
      mtbfHours,
      totalCostCents,
      lastInterventionAt,
    }
  })
}
