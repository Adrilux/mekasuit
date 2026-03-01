import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { assertModuleActive } from "@/lib/modules/module-access-checker"
import { ModuleName } from "@prisma/client"
import { queryGetSuppliers } from "@/server/queries/stock/query-get-suppliers"
import { queryGetStockItemsForPO } from "@/server/queries/stock/query-get-stock-items-for-po"
import { PurchaseOrderForm } from "@/components/stock/purchase-order-form"

export default async function NewPurchaseOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ items?: string }>
}) {
  const { items: itemsParam } = await searchParams
  const session = await requireSession()
  assertCan(session.role, "stock:po:create")
  await assertModuleActive(session.tenantId, ModuleName.STOCK_MANAGEMENT)

  const siteId = session.siteIds[0] ?? ""
  const prefilledItemIds = itemsParam ? itemsParam.split(",").filter(Boolean) : []

  const [suppliers, stockItems] = await Promise.all([
    queryGetSuppliers(session),
    queryGetStockItemsForPO(session, siteId),
  ])

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link
          href="/stock/purchase-orders"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-3"
        >
          <ChevronLeft className="w-4 h-4" />
          Commandes fournisseurs
        </Link>
        <h1 className="text-xl font-bold text-slate-900">Nouvelle commande fournisseur</h1>
        <p className="text-sm text-slate-500 mt-0.5">La commande sera créée en brouillon, en attente d&apos;approbation.</p>
      </div>

      <PurchaseOrderForm
        siteId={siteId}
        suppliers={suppliers}
        stockItems={stockItems}
        prefilledItemIds={prefilledItemIds}
      />
    </div>
  )
}
