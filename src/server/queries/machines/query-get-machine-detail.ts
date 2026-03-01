import { Prisma } from "@prisma/client"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import type { SessionUser } from "@/lib/auth/auth-session-helpers"

export async function queryGetMachineDetail(session: SessionUser, machineId: string) {
  return withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    return tx.machine.findUnique({
      where: { id: machineId },
      include: {
        site: { select: { id: true, name: true } },
        interventions: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            title: true,
            type: true,
            priority: true,
            status: true,
            createdAt: true,
            closedAt: true,
            assignedUserId: true,
          },
        },
        stockItems: {
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            reference: true,
            unit: true,
            quantityOnHand: true,
            minimumLevel: true,
          },
        },
        attachments: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            fileName: true,
            storedName: true,
            mimeType: true,
            sizeBytes: true,
            createdAt: true,
          },
        },
      },
    })
  })
}

export type MachineDetail = Awaited<ReturnType<typeof queryGetMachineDetail>>
