import { requireSession } from "@/lib/auth/auth-session-helpers"
import { isModuleActive } from "@/lib/modules/module-access-checker"
import { queryGetPendingTransfersCount } from "@/server/queries/stock/query-get-stock-transfers"
import { ModuleName } from "@prisma/client"
import { AppSidebar } from "./app-sidebar"

/**
 * Wrapper Server Component qui charge les données nécessaires à la sidebar
 * (ex: compteur transferts en attente) puis les passe au client component.
 */
export async function AppSidebarServer() {
  const session = await requireSession()

  const transfersModuleActive = await isModuleActive(
    session.tenantId,
    ModuleName.INTER_SITE_TRANSFERS
  )

  const pendingTransfersCount = transfersModuleActive
    ? await queryGetPendingTransfersCount(session)
    : 0

  return <AppSidebar pendingTransfersCount={pendingTransfersCount} />
}
