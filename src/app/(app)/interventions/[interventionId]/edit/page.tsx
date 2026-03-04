import { notFound } from "next/navigation"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan, assertSiteAccess } from "@/lib/permissions/permission-checker-server"
import { queryGetInterventionDetail } from "@/server/queries/interventions/query-get-intervention-detail"
import { queryGetSitesByTenant } from "@/server/queries/sites/query-get-sites-by-tenant"
import { isModuleActive } from "@/lib/modules/module-access-checker"
import { ModuleName } from "@prisma/client"
import { InterventionForm } from "@/components/interventions/intervention-form"
import { ValidationError } from "@/lib/errors/app-error-classes"

export default async function EditInterventionPage({
  params,
}: {
  params: Promise<{ interventionId: string }>
}) {
  const { interventionId } = await params
  const session = await requireSession()
  assertCan(session, "intervention:update")

  const [intervention, sites, aiEnabled] = await Promise.all([
    queryGetInterventionDetail(session, interventionId),
    queryGetSitesByTenant(session),
    isModuleActive(session.tenantId, ModuleName.AI_ASSISTANT),
  ])

  if (!intervention) notFound()
  assertSiteAccess(session, intervention.siteId)

  if (["CLOSED", "CANCELLED"].includes(intervention.status)) {
    throw new ValidationError("Impossible de modifier une intervention clôturée ou annulée")
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-bold text-slate-900 mb-6">Modifier l'intervention</h1>
      <InterventionForm
        sites={sites.filter((s) => s.isActive)}
        aiEnabled={aiEnabled}
        intervention={{
          id: intervention.id,
          siteId: intervention.siteId,
          title: intervention.title,
          description: intervention.description,
          type: intervention.type,
          priority: intervention.priority,
          assignedUserId: intervention.assignedUserId,
          scheduledAt: intervention.scheduledAt,
          recurrenceType: intervention.recurrenceType,
          recurrenceIntervalDays: intervention.recurrenceIntervalDays,
          recurrenceEndsAt: intervention.recurrenceEndsAt ?? null,
        }}
      />
    </div>
  )
}
