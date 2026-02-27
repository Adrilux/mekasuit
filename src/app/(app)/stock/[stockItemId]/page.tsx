import Link from "next/link"
import { notFound } from "next/navigation"
import { Pencil, AlertTriangle, TrendingUp, TrendingDown, RotateCcw, ArrowLeftRight } from "lucide-react"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertSiteAccess } from "@/lib/permissions/permission-checker-server"
import { assertModuleActive } from "@/lib/modules/module-access-checker"
import { ModuleName } from "@prisma/client"
import { queryGetStockItemDetail } from "@/server/queries/stock/query-get-stock-item-detail"
import { queryGetMachinesBySite } from "@/server/queries/machines/query-get-machines-by-site"
import { buildUserNameMap } from "@/server/queries/users/query-get-users-by-auth-ids"
import { Button } from "@/components/ui/button"
import { StockMovementDialog } from "@/components/stock/stock-movement-dialog"
import { StockDeleteButton } from "@/components/stock/stock-delete-button"
import { StockMachineLinkPanel } from "@/components/stock/stock-machine-link-panel"
import { can } from "@/lib/permissions/permission-matrix"

const MOVEMENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  IN: TrendingUp,
  OUT: TrendingDown,
  ADJUSTMENT: RotateCcw,
  TRANSFER_IN: ArrowLeftRight,
  TRANSFER_OUT: ArrowLeftRight,
}

const MOVEMENT_LABELS: Record<string, string> = {
  IN: "Entrée",
  OUT: "Sortie",
  ADJUSTMENT: "Ajustement",
  TRANSFER_IN: "Transfert entrant",
  TRANSFER_OUT: "Transfert sortant",
}

const MOVEMENT_COLORS: Record<string, string> = {
  IN: "text-green-600",
  OUT: "text-red-600",
  ADJUSTMENT: "text-blue-600",
  TRANSFER_IN: "text-green-600",
  TRANSFER_OUT: "text-red-600",
}

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

  assertSiteAccess(session.role, session.siteIds, item.siteId)

  const canEdit = can(session.role, "stock:update")
  const canMove = can(session.role, "stock:movement")

  // Charger les machines du site pour l'association
  const siteMachines = await queryGetMachinesBySite(session, item.siteId)
  const availableMachines = siteMachines.map((m) => ({ id: m.id, name: m.name }))

  // Résoudre les noms des opérateurs
  const operatorIds = [...new Set(item.movements.map((m) => m.operatorId))]
  const userNameMap = await buildUserNameMap(operatorIds)

  const isLowStock = item.quantityOnHand <= item.minimumLevel && item.minimumLevel > 0

  return (
    <div className="max-w-3xl space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
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
        <div className="flex flex-wrap gap-2">
          {canMove && (
            <StockMovementDialog
              stockItemId={item.id}
              itemName={item.name}
              currentQuantity={item.quantityOnHand}
              unit={item.unit}
            />
          )}
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

      {/* Historique des mouvements */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <h2 className="text-sm font-semibold text-slate-700 px-5 py-4 border-b border-slate-200">
          Historique des mouvements ({item.movements.length})
        </h2>

        {item.movements.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-400 text-center">Aucun mouvement enregistré</p>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-2 font-medium text-slate-600">Type</th>
                <th className="text-left px-4 py-2 font-medium text-slate-600">Quantité</th>
                <th className="text-left px-4 py-2 font-medium text-slate-600">Motif</th>
                <th className="text-left px-4 py-2 font-medium text-slate-600">Opérateur</th>
                <th className="text-left px-4 py-2 font-medium text-slate-600">Date</th>
              </tr>
            </thead>
            <tbody>
              {item.movements.map((m) => {
                const Icon = MOVEMENT_ICONS[m.type] ?? RotateCcw
                const color = MOVEMENT_COLORS[m.type] ?? "text-slate-600"
                const isPositive = ["IN", "TRANSFER_IN", "ADJUSTMENT"].includes(m.type)
                return (
                  <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className={`flex items-center gap-1.5 ${color}`}>
                        <Icon className="w-3.5 h-3.5" />
                        <span className="font-medium">{MOVEMENT_LABELS[m.type] ?? m.type}</span>
                      </div>
                    </td>
                    <td className={`px-4 py-3 font-semibold ${color}`}>
                      {isPositive ? "+" : "-"}{m.quantity} {item.unit}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{m.reason ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {userNameMap.get(m.operatorId) ?? "Inconnu"}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(m.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  )
}
