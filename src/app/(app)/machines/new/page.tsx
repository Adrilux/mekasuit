import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { queryGetSitesByTenant } from "@/server/queries/sites/query-get-sites-by-tenant"
import { MachineForm } from "@/components/machines/machine-form"

export default async function NewMachinePage() {
  const session = await requireSession()
  assertCan(session, "machine:create")

  const sites = await queryGetSitesByTenant(session)
  const activeSites = sites.filter((s) => s.isActive)

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-bold text-slate-900 mb-6">Ajouter une machine</h1>
      <MachineForm sites={activeSites} />
    </div>
  )
}
