import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ChevronLeft, ShoppingCart, PackageCheck, CheckCircle, Clock, XCircle, Ban } from "lucide-react"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan, assertSiteAccess } from "@/lib/permissions/permission-checker-server"
import { assertModuleActive } from "@/lib/modules/module-access-checker"
import { ModuleName } from "@prisma/client"
import { queryGetPurchaseOrderById } from "@/server/queries/stock/query-get-purchase-order-by-id"
import { buildUserNameMap } from "@/server/queries/users/query-get-users-by-auth-ids"
import { actionApprovePurchaseOrder } from "@/server/actions/stock/action-approve-purchase-order"
import { actionCancelPurchaseOrder } from "@/server/actions/stock/action-cancel-purchase-order"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PurchaseOrderReceiveForm } from "@/components/stock/purchase-order-receive-form"

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

const STATUS_ICONS: Record<string, React.FC<{ className?: string }>> = {
  DRAFT:     Clock,
  ORDERED:   ShoppingCart,
  RECEIVED:  CheckCircle,
  CANCELLED: Ban,
}

export default async function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params
  const session = await requireSession()
  assertCan(session, "stock:po:create")
  await assertModuleActive(session.tenantId, ModuleName.STOCK_MANAGEMENT)

  const order = await queryGetPurchaseOrderById(session, orderId)
  if (!order) notFound()

  assertSiteAccess(session, order.siteId)

  const allUserIds = [order.createdBy, order.approvedBy].filter(Boolean) as string[]
  const userNames = await buildUserNameMap(allUserIds)

  const canApprove = session.permissions.includes("stock:po:approve")
  const canReceive = session.permissions.includes("stock:po:receive")
  const canCancel  = session.permissions.includes("stock:po:cancel")

  const fullyReceived = order.items.every((i) => i.quantityReceived >= i.quantityOrdered)
  const receivedCount = order.items.filter((i) => i.quantityReceived >= i.quantityOrdered).length
  const StatusIcon = STATUS_ICONS[order.status] ?? ShoppingCart

  const totalOrderedCents = order.items.reduce(
    (sum, i) => sum + i.quantityOrdered * i.unitPriceCents,
    0,
  )

  return (
    <div className="max-w-3xl space-y-6">
      {/* En-tête */}
      <div>
        <Link
          href="/stock/purchase-orders"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-3"
        >
          <ChevronLeft className="w-4 h-4" />
          Commandes fournisseurs
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <StatusIcon className="w-6 h-6 text-slate-400" />
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Commande — {order.supplier.name}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Créée le {new Date(order.createdAt).toLocaleDateString("fr-FR")}
                {order.expectedDeliveryDate && (
                  <> · Livraison prévue le {new Date(order.expectedDeliveryDate).toLocaleDateString("fr-FR")}</>
                )}
              </p>
            </div>
          </div>
          <Badge variant={STATUS_VARIANTS[order.status]}>
            {STATUS_LABELS[order.status] ?? order.status}
          </Badge>
        </div>
      </div>

      {/* Infos commande */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-slate-500 mb-0.5">Fournisseur</dt>
            <dd className="font-medium text-slate-900">{order.supplier.name}</dd>
            {order.supplier.email && <dd className="text-slate-500">{order.supplier.email}</dd>}
            {order.supplier.phone && <dd className="text-slate-500">{order.supplier.phone}</dd>}
          </div>
          <div>
            <dt className="text-slate-500 mb-0.5">Créé par</dt>
            <dd className="font-medium text-slate-900">{userNames.get(order.createdBy) ?? "—"}</dd>
          </div>
          {order.approvedBy && (
            <div>
              <dt className="text-slate-500 mb-0.5">Approuvé par</dt>
              <dd className="font-medium text-slate-900">
                {userNames.get(order.approvedBy) ?? "—"}
                {order.approvedAt && (
                  <span className="text-slate-400 font-normal ml-1">
                    le {new Date(order.approvedAt).toLocaleDateString("fr-FR")}
                  </span>
                )}
              </dd>
            </div>
          )}
          {order.receivedAt && (
            <div>
              <dt className="text-slate-500 mb-0.5">Réceptionné le</dt>
              <dd className="font-medium text-slate-900">
                {new Date(order.receivedAt).toLocaleDateString("fr-FR")}
              </dd>
            </div>
          )}
          {totalOrderedCents > 0 && (
            <div>
              <dt className="text-slate-500 mb-0.5">Montant total estimé</dt>
              <dd className="font-medium text-slate-900">
                {(totalOrderedCents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
              </dd>
            </div>
          )}
          {order.notes && (
            <div className="col-span-2">
              <dt className="text-slate-500 mb-0.5">Notes</dt>
              <dd className="text-slate-700 whitespace-pre-line">{order.notes}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Progression réception */}
      {order.status === "ORDERED" && order.items.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">
              Réception : {receivedCount}/{order.items.length} articles
            </span>
            <span className="text-xs text-slate-500">{fullyReceived ? "Complet" : "Partiel"}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${order.items.length > 0 ? (receivedCount / order.items.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Table des articles */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 font-medium text-slate-800 text-sm">
          Articles commandés
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-2 font-medium text-slate-600">Article</th>
                <th className="text-left px-4 py-2 font-medium text-slate-600">Référence</th>
                <th className="text-right px-4 py-2 font-medium text-slate-600">Commandé</th>
                <th className="text-right px-4 py-2 font-medium text-slate-600">Prix unit.</th>
                <th className="text-right px-4 py-2 font-medium text-slate-600">Reçu</th>
                <th className="text-right px-4 py-2 font-medium text-slate-600">Restant</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => {
                const remaining = item.quantityOrdered - item.quantityReceived
                return (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="px-4 py-2 font-medium text-slate-900">
                      <Link href={`/stock/${item.stockItemId}`} className="hover:underline">
                        {item.stockItem.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-slate-500 font-mono text-xs">{item.stockItem.reference}</td>
                    <td className="px-4 py-2 text-right">{item.quantityOrdered} {item.stockItem.unit}</td>
                    <td className="px-4 py-2 text-right text-slate-500">
                      {item.unitPriceCents > 0
                        ? (item.unitPriceCents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })
                        : "—"}
                    </td>
                    <td className="px-4 py-2 text-right text-green-700">{item.quantityReceived}</td>
                    <td className={`px-4 py-2 text-right font-medium ${remaining > 0 ? "text-amber-600" : "text-slate-400"}`}>
                      {remaining}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions — DRAFT */}
      {order.status === "DRAFT" && (canApprove || canCancel) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
          <p className="text-sm font-medium text-amber-800">Commande en attente d&apos;approbation</p>
          <div className="flex items-center gap-3">
            {canApprove && (
              <form
                action={async () => {
                  "use server"
                  await actionApprovePurchaseOrder({ orderId })
                  redirect(`/stock/purchase-orders/${orderId}`)
                }}
              >
                <Button type="submit" size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  Approuver
                </Button>
              </form>
            )}
            {canCancel && (
              <form
                action={async () => {
                  "use server"
                  await actionCancelPurchaseOrder({ orderId })
                  redirect(`/stock/purchase-orders`)
                }}
              >
                <Button type="submit" variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                  <XCircle className="w-4 h-4 mr-1.5" />
                  Annuler la commande
                </Button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Formulaire de réception — ORDERED */}
      {order.status === "ORDERED" && canReceive && (
        <PurchaseOrderReceiveForm order={order} />
      )}

      {/* Bouton annuler pour ORDERED */}
      {order.status === "ORDERED" && canCancel && (
        <div className="flex justify-end">
          <form
            action={async () => {
              "use server"
              await actionCancelPurchaseOrder({ orderId })
              redirect(`/stock/purchase-orders`)
            }}
          >
            <Button type="submit" variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
              <XCircle className="w-4 h-4 mr-1" />
              Annuler la commande
            </Button>
          </form>
        </div>
      )}

      {/* Statut final */}
      {(order.status === "RECEIVED" || order.status === "CANCELLED") && (
        <div className={`rounded-lg border p-4 text-sm font-medium flex items-center gap-2 ${
          order.status === "RECEIVED"
            ? "bg-green-50 border-green-200 text-green-800"
            : "bg-slate-50 border-slate-200 text-slate-600"
        }`}>
          {order.status === "RECEIVED" ? (
            <><PackageCheck className="w-4 h-4" /> Réception complète — stock mis à jour.</>
          ) : (
            <><Ban className="w-4 h-4" /> Commande annulée.</>
          )}
        </div>
      )}
    </div>
  )
}
