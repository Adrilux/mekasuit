import { notFound } from "next/navigation"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan, assertSiteAccess } from "@/lib/permissions/permission-checker-server"
import { queryGetMachineDetail } from "@/server/queries/machines/query-get-machine-detail"
import { queryGetSitesByTenant } from "@/server/queries/sites/query-get-sites-by-tenant"
import { MachineForm } from "@/components/machines/machine-form"
import { ValidationError } from "@/lib/errors/app-error-classes"

export default async function EditMachinePage({ params }: { params: Promise<{ machineId: string }> }) {
  const { machineId } = await params
  const session = await requireSession()
  assertCan(session.role, "machine:update")

  const [machine, sites] = await Promise.all([
    queryGetMachineDetail(session, machineId),
    queryGetSitesByTenant(session),
  ])

  if (!machine) notFound()
  assertSiteAccess(session.role, session.siteIds, machine.siteId)

  if (machine.status === "DECOMMISSIONED") {
    throw new ValidationError("Impossible de modifier une machine archivée")
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-bold text-slate-900 mb-6">Modifier la machine</h1>
      <MachineForm
        sites={sites.filter((s) => s.isActive)}
        machine={{
          id: machine.id,
          siteId: machine.siteId,
          name: machine.name,
          serialNumber: machine.serialNumber,
          category: machine.category,
          manufacturer: machine.manufacturer,
          model: machine.model,
          installedAt: machine.installedAt,
          notes: machine.notes,
        }}
      />
    </div>
  )
}
