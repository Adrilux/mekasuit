import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, ClipboardList, CheckCircle, Clock } from "lucide-react"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertSiteAccess } from "@/lib/permissions/permission-checker-server"
import { assertModuleActive } from "@/lib/modules/module-access-checker"
import { ModuleName } from "@prisma/client"
import { queryGetInventorySessionDetail } from "@/server/queries/stock/query-get-inventory-session-detail"
import { can } from "@/lib/permissions/permission-matrix"
import { InventorySessionTable } from "@/components/stock/inventory-session-table"

export default async function InventorySessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const session = await requireSession()
  await assertModuleActive(session.tenantId, ModuleName.STOCK_MANAGEMENT)

  const inventorySession = await queryGetInventorySessionDetail(session, sessionId)
  if (!inventorySession) notFound()

  assertSiteAccess(session.role, session.siteIds, inventorySession.siteId)

  const canEdit = can(session.role, "stock:movement") && inventorySession.status === "OPEN"
  const countedCount = inventorySession.items.filter((i) => i.countedQuantity !== null).length

  return (
    <div className="max-w-4xl space-y-6">
      {/* En-tête */}
      <div>
        <Link
          href="/stock/inventory"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-3"
        >
          <ChevronLeft className="w-4 h-4" />
          Inventaires
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900">
                Inventaire du {new Date(inventorySession.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </h1>
              {inventorySession.status === "OPEN" ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  <Clock className="w-3 h-3" />
                  En cours
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                  <CheckCircle className="w-3 h-3" />
                  Clôturé
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1">
              <ClipboardList className="w-3.5 h-3.5 inline mr-1" />
              {countedCount}/{inventorySession.items.length} articles comptés
              {inventorySession.status === "CLOSED" && inventorySession.closedAt && (
                <> · Clôturé le {new Date(inventorySession.closedAt).toLocaleDateString("fr-FR")}</>
              )}
            </p>
          </div>
        </div>
      </div>

      {inventorySession.items.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg px-6 py-12 text-center">
          <p className="text-slate-400 text-sm">Aucun article dans cette session</p>
        </div>
      ) : (
        <InventorySessionTable
          sessionId={inventorySession.id}
          initialItems={inventorySession.items}
          isOpen={inventorySession.status === "OPEN" && canEdit}
        />
      )}
    </div>
  )
}
