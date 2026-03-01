import Link from "next/link"
import { Plus, Package, AlertTriangle, ArrowLeftRight, ClipboardList } from "lucide-react"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertModuleActive, isModuleActive } from "@/lib/modules/module-access-checker"
import { ModuleName } from "@prisma/client"
import { queryGetSitesByTenant } from "@/server/queries/sites/query-get-sites-by-tenant"
import { queryGetStockItemsBySite } from "@/server/queries/stock/query-get-stock-items-by-site"
import { Button } from "@/components/ui/button"
import { EmptyStatePlaceholder } from "@/components/feedback/empty-state-placeholder"
import { SiteSwitcher } from "@/components/layout/site-switcher"
import { StockFilters } from "@/components/stock/stock-filters"
import { ExportCsvButton } from "@/components/ui/export-csv-button"
import { can } from "@/lib/permissions/permission-matrix"

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<{ siteId?: string; search?: string; lowStock?: string }>
}) {
  const params = await searchParams
  const session = await requireSession()
  await assertModuleActive(session.tenantId, ModuleName.STOCK_MANAGEMENT)

  const sites = await queryGetSitesByTenant(session)
  const activeSite = (params.siteId ? sites.find((s) => s.id === params.siteId) : null)
    ?? sites.find((s) => s.isActive)
    ?? sites[0]
  const allItems = activeSite
    ? await queryGetStockItemsBySite(session, { siteId: activeSite.id, search: params.search })
    : []
  // lowStock filter: client-side because Prisma can't compare two columns in where
  const items = params.lowStock === "1"
    ? allItems.filter((i) => i.minimumLevel > 0 && i.quantityOnHand <= i.minimumLevel)
    : allItems

  const canCreate = can(session.role, "stock:create")
  const canScan = can(session.role, "stock:movement")
  const canInventory = can(session.role, "stock:movement")
  const canTransfer = can(session.role, "stock:transfer:create") && await isModuleActive(session.tenantId, ModuleName.INTER_SITE_TRANSFERS)

  const lowStockItems = items.filter((i) => i.quantityOnHand <= i.minimumLevel && i.minimumLevel > 0)
  const normalItems = items.filter((i) => i.quantityOnHand > i.minimumLevel || i.minimumLevel === 0)

  const exportParams = new URLSearchParams()
  if (activeSite) exportParams.set("siteId", activeSite.id)
  if (params.search) exportParams.set("search", params.search)
  if (params.lowStock) exportParams.set("lowStock", params.lowStock)
  const exportUrl = `/api/export/stock?${exportParams.toString()}`

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-bold text-slate-900">Stock</h1>
          <SiteSwitcher
            sites={sites.map((s) => ({ id: s.id, name: s.name }))}
            currentSiteId={activeSite?.id ?? ""}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportCsvButton href={exportUrl} />
          {canInventory && (
            <Button asChild variant="outline" size="sm">
              <Link href="/stock/inventory">
                <ClipboardList className="w-4 h-4 mr-1" />
                Inventaire
              </Link>
            </Button>
          )}
          {canTransfer && (
            <Button asChild variant="outline" size="sm">
              <Link href="/stock/transfers">
                <ArrowLeftRight className="w-4 h-4 mr-1" />
                Transferts
              </Link>
            </Button>
          )}
          {canScan && (
            <Button asChild variant="outline" size="sm">
              <Link href="/stock/scan">
                Scanner un code-barre
              </Link>
            </Button>
          )}
          {canCreate && (
            <Button asChild size="sm">
              <Link href="/stock/new">
                <Plus className="w-4 h-4 mr-1" />
                Nouvel article
              </Link>
            </Button>
          )}
        </div>
      </div>

      <StockFilters />

      {/* Alertes rupture */}
      {lowStockItems.length > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-800">
              {lowStockItems.length} article{lowStockItems.length > 1 ? "s" : ""} sous le seuil d'alerte
            </span>
          </div>
          <div className="space-y-1">
            {lowStockItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <Link href={`/stock/${item.id}`} className="text-amber-800 hover:underline font-medium">
                  {item.name}
                </Link>
                <span className="text-amber-700">
                  {item.quantityOnHand} / {item.minimumLevel} {item.unit} (seuil)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyStatePlaceholder
          icon={Package}
          title="Aucun article en stock"
          description="Créez votre premier article de stock pour commencer à gérer votre inventaire."
          action={
            canCreate ? (
              <Button asChild size="sm">
                <Link href="/stock/new">Créer un article</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-medium text-slate-600">Référence</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Désignation</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Stock</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Seuil</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Coût unit.</th>
              </tr>
            </thead>
            <tbody>
              {[...lowStockItems, ...normalItems].map((item) => {
                const isLow = item.quantityOnHand <= item.minimumLevel && item.minimumLevel > 0
                return (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{item.reference}</td>
                    <td className="px-4 py-3">
                      <Link href={`/stock/${item.id}`} className="font-medium text-slate-900 hover:text-blue-600">
                        {item.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${isLow ? "text-amber-600" : "text-slate-900"}`}>
                        {item.quantityOnHand}
                      </span>
                      <span className="text-slate-400 ml-1 text-xs">{item.unit}</span>
                      {isLow && <AlertTriangle className="w-3 h-3 text-amber-500 inline ml-1" />}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{item.minimumLevel} {item.unit}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {item.unitCostCents > 0 ? `${(item.unitCostCents / 100).toFixed(2)} €` : "—"}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  )
}
