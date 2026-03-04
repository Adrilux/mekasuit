import { Prisma } from "@prisma/client"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import type { SessionUser } from "@/lib/auth/auth-session-helpers"

export type StockItemSupplierDetail = {
  id: string
  supplierId: string
  supplierName: string
  supplierReference: string | null
  purchasePriceCents: number
  leadTimeDays: number | null
  productUrls: string[]
}

export async function queryGetStockItemSuppliers(
  session: SessionUser,
  stockItemId: string,
): Promise<StockItemSupplierDetail[]> {
  return withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    const links = await tx.stockItemSupplier.findMany({
      where: { stockItemId, tenantId: session.tenantId },
      select: {
        id: true,
        supplierId: true,
        supplier: { select: { name: true } },
        supplierReference: true,
        purchasePriceCents: true,
        leadTimeDays: true,
        productUrls: true,
      },
      orderBy: { supplier: { name: "asc" } },
    })
    return links.map((l) => ({
      id: l.id,
      supplierId: l.supplierId,
      supplierName: l.supplier.name,
      supplierReference: l.supplierReference,
      purchasePriceCents: l.purchasePriceCents,
      leadTimeDays: l.leadTimeDays,
      productUrls: l.productUrls,
    }))
  })
}
