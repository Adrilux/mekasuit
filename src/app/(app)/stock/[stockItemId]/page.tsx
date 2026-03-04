import Link from "next/link"
import { notFound } from "next/navigation"
import { headers } from "next/headers"
import { Pencil, AlertTriangle } from "lucide-react"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertSiteAccess } from "@/lib/permissions/permission-checker-server"
import { assertModuleActive } from "@/lib/modules/module-access-checker"
import { ModuleName } from "@prisma/client"
import { queryGetStockItemDetail } from "@/server/queries/stock/query-get-stock-item-detail"
import { queryGetMachinesBySite } from "@/server/queries/machines/query-get-machines-by-site"
import { queryGetSuppliers } from "@/server/queries/stock/query-get-suppliers"
import { queryGetStockItemSuppliers } from "@/server/queries/stock/query-get-stock-item-suppliers"
import { buildUserNameMap } from "@/server/queries/users/query-get-users-by-auth-ids"
import { Button } from "@/components/ui/button"
import { StockMovementDialog } from "@/components/stock/stock-movement-dialog"
import { StockDeleteButton } from "@/components/stock/stock-delete-button"
import { StockMachineLinkPanel } from "@/components/stock/stock-machine-link-panel"
import { StockSuppliersPanel } from "@/components/stock/stock-suppliers-panel"
import { StockQrCode } from "@/components/stock/stock-qr-code"
import { StockMovementHistory } from "@/components/stock/stock-movement-history"
import { StockItemImage } from "@/components/stock/stock-item-image"


export default async function StockItemDetailPage({
  params,
}: {
  params: Promise<{ stockItemId: string }>
}) {
  const { stockItemId } = await params
  const session = await requireSession()
  await assertModuleActive(session.tenantId, ModuleName.STOCK_MANAGEMENT)

  const item = await queryGetStockItemDetail(session, stockItemId)
  if (!item) notFound()

  assertSiteAccess(session, item.siteId)

  const canEdit = session.permissions.includes("stock:update")
  const canMove = session.permissions.includes("stock:movement")
  const canCancelMovement = session.permissions.includes("stock:movement:cancel")

  // Charger les machines, fournisseurs et opérateurs en parallèle
  const [siteMachines, suppliers, itemSuppliers] = await Promise.all([
    queryGetMachinesBySite(session, item.siteId),
    queryGetSuppliers(session),
    queryGetStockItemSuppliers(session, stockItemId),
  ])
  const availableMachines = siteMachines.map((m) => ({ id: m.id, name: m.name }))

  // Résoudre les noms des opérateurs
  const operatorIds = [...new Set(item.movements.map((m) => m.operatorId))]
  const userNameMap = await buildUserNameMap(operatorIds)

  // URL de base pour les QR codes
  const headersList = await headers()
  const host = headersList.get("host") ?? "localhost:3000"
  const proto = headersList.get("x-forwarded-proto") ?? "http"
  const baseUrl = `${proto}://${host}`

  const isLowStock = item.quantityOnHand <= item.minimumLevel && item.minimumLevel > 0

  return (
    <div className="max-w-3xl space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex items-start gap-4">
          <StockItemImage
            stockItemId={item.id}
            imageUrl={item.imageUrl ?? null}
            canEdit={canEdit}
          />
          <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900">{item.name}</h1>
            {isLowStock && (
              <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                <AlertTriangle className="w-3 h-3" />
                Stock faible
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 font-mono mt-1">{item.reference}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canMove && (
            <StockMovementDialog
              stockItemId={item.id}
              itemName={item.name}
              currentQuantity={item.quantityOnHand}
              unit={item.unit}
            />
          )}
          <StockQrCode
            stockItemId={item.id}
            reference={item.reference}
            itemName={item.name}
            baseUrl={baseUrl}
          />
          {canEdit && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/stock/${item.id}/edit`}>
                <Pencil className="w-4 h-4 mr-1" />
                Modifier
              </Link>
            </Button>
          )}
          {canEdit && (
            <StockDeleteButton stockItemId={item.id} itemName={item.name} />
          )}
        </div>
      </div>

      {/* Métriques */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 text-center">
          <p className="text-xs text-slate-500 mb-1">Stock actuel</p>
          <p className={`text-2xl font-bold ${isLowStock ? "text-amber-600" : "text-slate-900"}`}>
            {item.quantityOnHand}
          </p>
          <p className="text-xs text-slate-400">{item.unit}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 text-center">
          <p className="text-xs text-slate-500 mb-1">Seuil d'alerte</p>
          <p className="text-2xl font-bold text-slate-900">{item.minimumLevel}</p>
          <p className="text-xs text-slate-400">{item.unit}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 text-center">
          <p className="text-xs text-slate-500 mb-1">Coût unitaire</p>
          <p className="text-2xl font-bold text-slate-900">
            {item.unitCostCents > 0 ? `${(item.unitCostCents / 100).toFixed(2)} €` : "—"}
          </p>
          {item.unitCostCents > 0 && (
            <p className="text-xs text-slate-400">
              Valeur stock : {((item.unitCostCents * item.quantityOnHand) / 100).toFixed(2)} €
            </p>
          )}
        </div>
      </div>

      {/* Machine associée */}
      <StockMachineLinkPanel
        stockItemId={item.id}
        currentMachine={item.machine ?? null}
        availableMachines={availableMachines}
        canEdit={canEdit}
      />

      {/* Fournisseurs */}
      <StockSuppliersPanel
        stockItemId={item.id}
        initialLinks={itemSuppliers}
        suppliers={suppliers}
        canEdit={canEdit}
      />

      {/* Historique des mouvements */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <h2 className="text-sm font-semibold text-slate-700 px-5 py-4 border-b border-slate-200">
          Historique des mouvements ({item.movements.length})
        </h2>
        <StockMovementHistory
          movements={item.movements}
          unit={item.unit}
          userNameMap={userNameMap}
          canCancel={canCancelMovement}
        />
      </div>
    </div>
  )
}
