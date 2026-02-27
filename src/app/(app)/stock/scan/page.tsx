import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { assertModuleActive } from "@/lib/modules/module-access-checker"
import { ModuleName } from "@prisma/client"
import { queryGetSitesByTenant } from "@/server/queries/sites/query-get-sites-by-tenant"
import { StockBarcodeScanner } from "@/components/stock/stock-barcode-scanner"

export default async function StockScanPage() {
  const session = await requireSession()
  assertCan(session.role, "stock:movement")
  await assertModuleActive(session.tenantId, ModuleName.STOCK_MANAGEMENT)

  const sites = await queryGetSitesByTenant(session)
  const activeSite = sites.find((s) => s.isActive) ?? sites[0]

  if (!activeSite) {
    return (
      <div className="max-w-lg">
        <p className="text-slate-500">Aucun site actif trouvé.</p>
      </div>
    )
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Scanner un code-barre</h1>
        <p className="text-sm text-slate-500 mt-1">
          {activeSite.name} · Compatible douchette USB et caméra
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <StockBarcodeScanner siteId={activeSite.id} />
      </div>

      <p className="text-xs text-slate-400 mt-4 text-center">
        La référence de l'article doit correspondre exactement au code scanné.<br />
        Configurez les références dans les fiches articles.
      </p>
    </div>
  )
}
