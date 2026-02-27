import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { assertModuleActive } from "@/lib/modules/module-access-checker"
import { ModuleName } from "@prisma/client"
import { queryGetSitesByTenant } from "@/server/queries/sites/query-get-sites-by-tenant"
import { StockItemForm } from "@/components/stock/stock-item-form"

export default async function NewStockItemPage() {
  const session = await requireSession()
  assertCan(session.role, "stock:create")
  await assertModuleActive(session.tenantId, ModuleName.STOCK_MANAGEMENT)

  const sites = await queryGetSitesByTenant(session)

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-bold text-slate-900 mb-6">Nouvel article de stock</h1>
      <StockItemForm sites={sites.filter((s) => s.isActive)} />
    </div>
  )
}
