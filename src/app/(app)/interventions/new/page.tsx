import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { queryGetSitesByTenant } from "@/server/queries/sites/query-get-sites-by-tenant"
import { queryGetInterventionTemplates } from "@/server/queries/intervention-templates/query-get-intervention-templates"
import { isModuleActive } from "@/lib/modules/module-access-checker"
import { ModuleName } from "@prisma/client"
import { InterventionForm } from "@/components/interventions/intervention-form"

export default async function NewInterventionPage({
  searchParams,
}: {
  searchParams: Promise<{ machineId?: string; siteId?: string; type?: string }>
}) {
  const { machineId, siteId, type } = await searchParams
  const session = await requireSession()
  assertCan(session, "intervention:create")

  const [sites, aiEnabled, templates] = await Promise.all([
    queryGetSitesByTenant(session),
    isModuleActive(session.tenantId, ModuleName.AI_ASSISTANT),
    queryGetInterventionTemplates(session),
  ])

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-bold text-slate-900 mb-6">Nouvelle intervention</h1>
      <InterventionForm
        sites={sites.filter((s) => s.isActive)}
        defaultSiteId={siteId}
        defaultMachineId={machineId}
        defaultType={type as "PREVENTIVE" | "CORRECTIVE" | undefined}
        aiEnabled={aiEnabled}
        templates={templates}
      />
    </div>
  )
}
