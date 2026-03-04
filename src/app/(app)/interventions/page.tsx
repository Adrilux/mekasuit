import Link from "next/link"
import { Plus, ClipboardList } from "lucide-react"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { queryGetSitesByTenant } from "@/server/queries/sites/query-get-sites-by-tenant"
import { queryGetInterventionsBySite } from "@/server/queries/interventions/query-get-interventions-by-site"
import { buildUserNameMap } from "@/server/queries/users/query-get-users-by-auth-ids"
import { Button } from "@/components/ui/button"
import { InterventionStatusBadge } from "@/components/interventions/intervention-status-badge"
import { InterventionPriorityBadge } from "@/components/interventions/intervention-priority-badge"
import { EmptyStatePlaceholder } from "@/components/feedback/empty-state-placeholder"
import { SiteSwitcher } from "@/components/layout/site-switcher"
import { InterventionFilters } from "@/components/interventions/intervention-filters"
import { ExportCsvButton } from "@/components/ui/export-csv-button"
import type { InterventionListItem } from "@/server/queries/interventions/query-get-interventions-by-site"
import type { InterventionStatus, InterventionType, InterventionPriority } from "@prisma/client"

export default async function InterventionsPage({
  searchParams,
}: {
  searchParams: Promise<{ siteId?: string; status?: string; type?: string; priority?: string; search?: string }>
}) {
  const params = await searchParams
  const session = await requireSession()
  const sites = await queryGetSitesByTenant(session)

  const activeSite = (params.siteId ? sites.find((s) => s.id === params.siteId) : null)
    ?? sites.find((s) => s.isActive)
    ?? sites[0]
  const interventions = activeSite
    ? await queryGetInterventionsBySite(session, {
        siteId: activeSite.id,
        status: params.status as InterventionStatus | undefined,
        type: params.type as InterventionType | undefined,
        priority: params.priority as InterventionPriority | undefined,
        search: params.search,
      })
    : []

  const canCreate = session.permissions.includes("intervention:create")

  // Résolution des noms des techniciens assignés
  const assignedIds = interventions
    .map((i) => i.assignedUserId)
    .filter((id): id is string => !!id)
  const userNameMap = await buildUserNameMap([...new Set(assignedIds)])

  // Sépare ouvertes / terminées pour la lisibilité
  const openInterventions = interventions.filter((i) => !["CLOSED", "CANCELLED"].includes(i.status))
  const closedInterventions = interventions.filter((i) => ["CLOSED", "CANCELLED"].includes(i.status))

  // URL export CSV (reprend les mêmes filtres)
  const exportParams = new URLSearchParams()
  if (activeSite) exportParams.set("siteId", activeSite.id)
  if (params.status) exportParams.set("status", params.status)
  if (params.type) exportParams.set("type", params.type)
  if (params.priority) exportParams.set("priority", params.priority)
  if (params.search) exportParams.set("search", params.search)
  const exportUrl = `/api/export/interventions?${exportParams.toString()}`

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-bold text-slate-900">Interventions</h1>
          <SiteSwitcher
            sites={sites.map((s) => ({ id: s.id, name: s.name }))}
            currentSiteId={activeSite?.id ?? ""}
          />
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <ExportCsvButton href={exportUrl} />
          {canCreate && (
            <Button asChild size="sm">
              <Link href="/interventions/new">
                <Plus className="w-4 h-4 mr-1" />
                Nouvelle intervention
              </Link>
            </Button>
          )}
        </div>
      </div>

      <InterventionFilters />

      {interventions.length === 0 ? (
        <EmptyStatePlaceholder
          icon={ClipboardList}
          title="Aucune intervention"
          description="Les interventions de maintenance apparaîtront ici."
          action={
            canCreate ? (
              <Button asChild size="sm">
                <Link href="/interventions/new">Créer une intervention</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Interventions en cours */}
          {openInterventions.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-700 mb-3">En cours ({openInterventions.length})</h2>
              <InterventionTable interventions={openInterventions} userNameMap={userNameMap} />
            </section>
          )}

          {/* Interventions terminées */}
          {closedInterventions.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-500 mb-3">Terminées / annulées</h2>
              <InterventionTable interventions={closedInterventions} userNameMap={userNameMap} muted />
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function InterventionTable({
  interventions,
  userNameMap,
  muted = false,
}: {
  interventions: InterventionListItem[]
  userNameMap: Map<string, string>
  muted?: boolean
}) {
  return (
    <div className={`bg-white rounded-lg border overflow-hidden ${muted ? "border-slate-100" : "border-slate-200"}`}>
      <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className={`border-b ${muted ? "bg-slate-50/50 border-slate-100" : "bg-slate-50 border-slate-200"}`}>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Titre</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Machine</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Technicien</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Priorité</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Statut</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Date</th>
          </tr>
        </thead>
        <tbody>
          {interventions.map((intervention) => (
            <tr key={intervention.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${muted ? "opacity-70" : ""}`}>
              <td className="px-4 py-3">
                <Link href={`/interventions/${intervention.id}`} className="font-medium text-slate-900 hover:text-blue-600">
                  {intervention.title}
                </Link>
              </td>
              <td className="px-4 py-3 text-slate-600">{intervention.machine?.name ?? "—"}</td>
              <td className="px-4 py-3 text-slate-600">
                {intervention.assignedUserId
                  ? (userNameMap.get(intervention.assignedUserId) ?? "—")
                  : "—"}
              </td>
              <td className="px-4 py-3">
                <InterventionPriorityBadge priority={intervention.priority} />
              </td>
              <td className="px-4 py-3">
                <InterventionStatusBadge status={intervention.status} />
              </td>
              <td className="px-4 py-3 text-slate-500">
                {new Date(intervention.createdAt).toLocaleDateString("fr-FR")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  )
}
