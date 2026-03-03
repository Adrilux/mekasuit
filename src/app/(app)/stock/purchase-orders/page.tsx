import Link from "next/link"
import { Plus, ShoppingCart } from "lucide-react"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { assertModuleActive } from "@/lib/modules/module-access-checker"
import { ModuleName } from "@prisma/client"
import { queryGetPurchaseOrders } from "@/server/queries/stock/query-get-purchase-orders"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmptyStatePlaceholder } from "@/components/feedback/empty-state-placeholder"
import { can } from "@/lib/permissions/permission-matrix"

const STATUS_LABELS: Record<string, string> = {
  DRAFT:     "Brouillon",
  ORDERED:   "Commandé",
  RECEIVED:  "Réceptionné",
  CANCELLED: "Annulé",
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  DRAFT:     "secondary",
  ORDERED:   "default",
  RECEIVED:  "outline",
  CANCELLED: "destructive",
}

export default async function PurchaseOrdersPage() {
  const session = await requireSession()
  assertCan(session.role, "stock:read")
  await assertModuleActive(session.tenantId, ModuleName.STOCK_MANAGEMENT)

  const siteId = session.siteIds[0] ?? ""
  const orders = await queryGetPurchaseOrders(session, siteId)

  const canCreate  = can(session.role, "stock:po:create")
  const canApprove = can(session.role, "stock:po:approve")

  const drafts    = orders.filter((o) => o.status === "DRAFT")
  const ordered   = orders.filter((o) => o.status === "ORDERED")
  const archived  = orders.filter((o) => o.status === "RECEIVED" || o.status === "CANCELLED")

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Commandes fournisseurs</h1>
          <p className="text-sm text-slate-500 mt-0.5">Bons de commande et réceptions</p>
        </div>
        {canCreate && (
          <Button asChild size="sm" className="self-start sm:self-auto">
            <Link href="/stock/purchase-orders/new">
              <Plus className="w-4 h-4 mr-1" />
              Nouvelle commande
            </Link>
          </Button>
        )}
      </div>

      {orders.length === 0 ? (
        <EmptyStatePlaceholder
          icon={ShoppingCart}
          title="Aucune commande"
          description="Les bons de commande fournisseurs apparaîtront ici."
          action={
            canCreate ? (
              <Button asChild size="sm">
                <Link href="/stock/purchase-orders/new">Créer une commande</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-6">
          {drafts.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-amber-700 uppercase tracking-wide mb-3">
                En attente d&apos;approbation ({drafts.length})
              </h2>
              <div className="bg-white border border-amber-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <OrderTable orders={drafts} canApprove={canApprove} />
                </div>
              </div>
            </section>
          )}

          {ordered.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-3">
                En cours ({ordered.length})
              </h2>
              <div className="bg-white border border-blue-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <OrderTable orders={ordered} canApprove={false} />
                </div>
              </div>
            </section>
          )}

          {archived.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Historique
              </h2>
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <OrderTable orders={archived} canApprove={false} />
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function OrderTable({
  orders,
  canApprove,
}: {
  orders: Awaited<ReturnType<typeof queryGetPurchaseOrders>>
  canApprove: boolean
}) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-slate-50 border-b border-slate-200">
          <th className="text-left px-4 py-3 font-medium text-slate-600">Fournisseur</th>
          <th className="text-left px-4 py-3 font-medium text-slate-600">Articles</th>
          <th className="text-left px-4 py-3 font-medium text-slate-600">Date</th>
          <th className="text-left px-4 py-3 font-medium text-slate-600">Statut</th>
          <th className="px-4 py-3" />
        </tr>
      </thead>
      <tbody>
        {orders.map((o) => (
          <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50">
            <td className="px-4 py-3 font-medium text-slate-900">{o.supplierName}</td>
            <td className="px-4 py-3 text-slate-600">
              {o.itemCount} article{o.itemCount > 1 ? "s" : ""} · {o.totalQuantityOrdered} unité{o.totalQuantityOrdered > 1 ? "s" : ""}
            </td>
            <td className="px-4 py-3 text-slate-500">
              {new Date(o.createdAt).toLocaleDateString("fr-FR")}
            </td>
            <td className="px-4 py-3">
              <Badge variant={STATUS_VARIANTS[o.status]}>
                {STATUS_LABELS[o.status] ?? o.status}
              </Badge>
            </td>
            <td className="px-4 py-3">
              <Link
                href={`/stock/purchase-orders/${o.id}`}
                className="text-xs text-blue-600 hover:underline"
              >
                {canApprove && o.status === "DRAFT" ? "Approuver" : "Voir"}
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
