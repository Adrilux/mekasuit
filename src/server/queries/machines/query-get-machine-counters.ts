import { Prisma } from "@prisma/client"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import type { SessionUser } from "@/lib/auth/auth-session-helpers"

export async function queryGetMachineCounters(session: SessionUser, machineId: string) {
  return withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    return tx.machineCounter.findMany({
      where: { machineId },
      orderBy: { createdAt: "asc" },
      include: {
        readings: {
          orderBy: { recordedAt: "desc" },
          take: 10,
          select: {
            id: true,
            value: true,
            recordedAt: true,
            recordedBy: true,
            note: true,
          },
        },
      },
    })
  })
}

export type MachineCounterWithReadings = Awaited<ReturnType<typeof queryGetMachineCounters>>[number]
