import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { assertModuleActive } from "@/lib/modules/module-access-checker"
import { ModuleName } from "@prisma/client"
import { queryGetSitesByTenant } from "@/server/queries/sites/query-get-sites-by-tenant"
import { StockTransferForm } from "@/components/stock/stock-transfer-form"

export default async function NewStockTransferPage() {
  const session = await requireSession()
  assertCan(session.role, "stock:transfer:create")
  await assertModuleActive(session.tenantId, ModuleName.INTER_SITE_TRANSFERS)

  const sites = await queryGetSitesByTenant(session)
  const activeSites = sites.filter((s) => s.isActive)

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-bold text-slate-900 mb-6">Nouveau transfert de stock</h1>
      <StockTransferForm sites={activeSites} userSiteIds={session.siteIds} />
    </div>
  )
}
