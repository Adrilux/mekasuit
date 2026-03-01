import { requireSession } from "@/lib/auth/auth-session-helpers"
import { isModuleActive } from "@/lib/modules/module-access-checker"
import { queryGetPendingTransfersCount } from "@/server/queries/stock/query-get-stock-transfers"
import { queryGetDraftPurchaseOrdersCount } from "@/server/queries/stock/query-get-purchase-orders"
import { ModuleName } from "@prisma/client"
import { AppSidebar } from "./app-sidebar"

/**
 * Wrapper Server Component qui charge les données nécessaires à la sidebar
 * (ex: compteur transferts en attente, commandes BC en brouillon) puis les passe au client component.
 */
export async function AppSidebarServer() {
  const session = await requireSession()

  const [transfersModuleActive, stockModuleActive] = await Promise.all([
    isModuleActive(session.tenantId, ModuleName.INTER_SITE_TRANSFERS),
    isModuleActive(session.tenantId, ModuleName.STOCK_MANAGEMENT),
  ])

  const [pendingTransfersCount, draftPurchaseOrdersCount] = await Promise.all([
    transfersModuleActive ? queryGetPendingTransfersCount(session) : Promise.resolve(0),
    stockModuleActive ? queryGetDraftPurchaseOrdersCount(session) : Promise.resolve(0),
  ])

  return (
    <AppSidebar
      pendingTransfersCount={pendingTransfersCount}
      draftPurchaseOrdersCount={draftPurchaseOrdersCount}
    />
  )
}
