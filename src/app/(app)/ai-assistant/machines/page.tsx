import { requireSession } from "@/lib/auth/auth-session-helpers"
import { isModuleActive } from "@/lib/modules/module-access-checker"
import { ModuleName, Prisma } from "@prisma/client"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { MachineFailureAnalysisClient } from "./machine-failure-analysis-client"

export default async function MachineFailureAnalysisPage() {
  const session = await requireSession()

  const active = await isModuleActive(session.tenantId, ModuleName.AI_ASSISTANT)
  if (!active) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <p className="text-4xl mb-4">🤖</p>
        <h1 className="text-lg font-semibold text-slate-900 mb-2">Module non activé</h1>
        <p className="text-sm text-slate-500">L&apos;assistant IA n&apos;est pas inclus dans votre abonnement.</p>
      </div>
    )
  }

  // Load all machines accessible to this user (filtered by siteIds for non-admins)
  const machines = await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    return tx.machine.findMany({
      where: {
        status: { not: "DECOMMISSIONED" },
        ...(["workshop_manager", "technician", "reader"].includes(session.role)
          ? { siteId: { in: session.siteIds } }
          : {}),
      },
      orderBy: [{ site: { name: "asc" } }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        category: true,
        site: { select: { name: true } },
      },
    })
  })

  const machineList = machines.map((m) => ({
    id: m.id,
    name: m.name,
    category: m.category,
    siteName: m.site.name,
  }))

  return <MachineFailureAnalysisClient machines={machineList} />
}
