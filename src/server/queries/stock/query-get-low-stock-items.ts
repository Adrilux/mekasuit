import { Prisma } from "@prisma/client"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import type { SessionUser } from "@/lib/auth/auth-session-helpers"

export type LowStockItem = {
  id: string
  reference: string
  name: string
  unit: string
  quantityOnHand: number
  minimumLevel: number
  suppliers: { id: string; name: string }[]
}

export async function queryGetLowStockItems(
  session: SessionUser,
  siteId: string,
): Promise<LowStockItem[]> {
  return withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    const items = await tx.stockItem.findMany({
      where: { tenantId: session.tenantId, siteId },
      select: {
        id: true,
        reference: true,
        name: true,
        unit: true,
        quantityOnHand: true,
        minimumLevel: true,
        supplierLinks: {
          select: { supplier: { select: { id: true, name: true } } },
        },
      },
      orderBy: { name: "asc" },
    })
    return items
      .filter((item) => item.quantityOnHand <= item.minimumLevel)
      .map((item) => ({
        id: item.id,
        reference: item.reference,
        name: item.name,
        unit: item.unit,
        quantityOnHand: item.quantityOnHand,
        minimumLevel: item.minimumLevel,
        suppliers: item.supplierLinks.map((l) => l.supplier),
      }))
  })
}
