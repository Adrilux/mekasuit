import { Prisma } from "@prisma/client"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import type { SessionUser } from "@/lib/auth/auth-session-helpers"

export async function queryGetMachineBom(session: SessionUser, machineId: string) {
  return withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    return tx.machineComponent.findMany({
      where: { machineId },
      orderBy: [{ parentId: "asc" }, { position: "asc" }, { name: "asc" }],
      select: {
        id: true,
        parentId: true,
        name: true,
        description: true,
        quantity: true,
        position: true,
        stockItemId: true,
        stockItem: {
          select: {
            id: true,
            name: true,
            reference: true,
            unit: true,
            quantityOnHand: true,
            minimumLevel: true,
          },
        },
        createdAt: true,
      },
    })
  })
}

export type BomNode = Awaited<ReturnType<typeof queryGetMachineBom>>[number]
