import Link from "next/link"
import { AlertTriangle, ShoppingCart } from "lucide-react"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { assertModuleActive } from "@/lib/modules/module-access-checker"
import { ModuleName } from "@prisma/client"
import { queryGetLowStockItems } from "@/server/queries/stock/query-get-low-stock-items"
import { LowStockTable } from "@/components/stock/low-stock-table"
import { EmptyStatePlaceholder } from "@/components/feedback/empty-state-placeholder"
import { Button } from "@/components/ui/button"

export default async function LowStockPage() {
  const session = await requireSession()
  assertCan(session, "stock:read")
  await assertModuleActive(session.tenantId, ModuleName.STOCK_MANAGEMENT)

  const siteId = session.siteIds[0] ?? ""
  const items = await queryGetLowStockItems(session, siteId)

  const canOrder = session.permissions.includes("stock:po:create")

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Articles en rupture</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Articles dont le stock est inférieur ou égal au seuil minimum
          </p>
        </div>
        {canOrder && items.length > 0 && (
          <Button asChild size="sm" variant="outline" className="self-start sm:self-auto">
            <Link href="/stock/purchase-orders/new">
              <ShoppingCart className="w-4 h-4 mr-1.5" />
              Nouvelle commande
            </Link>
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyStatePlaceholder
          icon={AlertTriangle}
          title="Aucune rupture de stock"
          description="Tous les articles sont au-dessus de leur seuil minimum."
        />
      ) : (
        <>
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-2 text-sm text-amber-800">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{items.length} article{items.length > 1 ? "s" : ""} en rupture ou sous le seuil minimum.</span>
          </div>
          <LowStockTable items={items} />
        </>
      )}
    </div>
  )
}
