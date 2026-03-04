import { notFound } from "next/navigation"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan, assertSiteAccess } from "@/lib/permissions/permission-checker-server"
import { assertModuleActive } from "@/lib/modules/module-access-checker"
import { ModuleName } from "@prisma/client"
import { queryGetStockItemDetail } from "@/server/queries/stock/query-get-stock-item-detail"
import { queryGetSitesByTenant } from "@/server/queries/sites/query-get-sites-by-tenant"
import { StockItemForm } from "@/components/stock/stock-item-form"

export default async function EditStockItemPage({
  params,
}: {
  params: Promise<{ stockItemId: string }>
}) {
  const { stockItemId } = await params
  const session = await requireSession()
  assertCan(session, "stock:update")
  await assertModuleActive(session.tenantId, ModuleName.STOCK_MANAGEMENT)

  const [item, sites] = await Promise.all([
    queryGetStockItemDetail(session, stockItemId),
    queryGetSitesByTenant(session),
  ])

  if (!item) notFound()
  assertSiteAccess(session, item.siteId)

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-bold text-slate-900 mb-6">Modifier l'article</h1>
      <StockItemForm
        sites={sites.filter((s) => s.isActive)}
        stockItem={{
          id: item.id,
          siteId: item.siteId,
          reference: item.reference,
          name: item.name,
          unit: item.unit,
          quantityOnHand: item.quantityOnHand,
          minimumLevel: item.minimumLevel,
          unitCostCents: item.unitCostCents,
        }}
      />
    </div>
  )
}
