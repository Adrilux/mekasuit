import { redirect } from "next/navigation"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { assertModuleActive } from "@/lib/modules/module-access-checker"
import { ModuleName } from "@prisma/client"
import { actionCreateInventorySession } from "@/server/actions/stock/action-create-inventory-session"

// Cette page crée la session puis redirige vers elle
export default async function NewInventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ siteId?: string }>
}) {
  const { siteId } = await searchParams
  const session = await requireSession()
  assertCan(session.role, "stock:movement")
  await assertModuleActive(session.tenantId, ModuleName.STOCK_MANAGEMENT)

  if (!siteId) redirect("/stock/inventory")

  const result = await actionCreateInventorySession({ siteId })

  if (!result.success) {
    // Rediriger avec l'erreur (si session déjà en cours, on redirige vers la liste)
    redirect("/stock/inventory")
  }

  const { id } = result.data as { id: string }
  redirect(`/stock/inventory/${id}`)
}
