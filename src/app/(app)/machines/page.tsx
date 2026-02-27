import Link from "next/link"
import { Plus, Wrench } from "lucide-react"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { queryGetSitesByTenant } from "@/server/queries/sites/query-get-sites-by-tenant"
import { queryGetMachinesBySite } from "@/server/queries/machines/query-get-machines-by-site"
import { Button } from "@/components/ui/button"
import { MachineStatusBadge } from "@/components/machines/machine-status-badge"
import { EmptyStatePlaceholder } from "@/components/feedback/empty-state-placeholder"
import { SiteSwitcher } from "@/components/layout/site-switcher"
import { MachineFilters } from "@/components/machines/machine-filters"
import { ExportCsvButton } from "@/components/ui/export-csv-button"
import { can } from "@/lib/permissions/permission-matrix"

export default async function MachinesPage({
  searchParams,
}: {
  searchParams: Promise<{ siteId?: string; search?: string; status?: string }>
}) {
  const params = await searchParams
  const session = await requireSession()
  const sites = await queryGetSitesByTenant(session)

  const activeSite = (params.siteId ? sites.find((s) => s.id === params.siteId) : null)
    ?? sites.find((s) => s.isActive)
    ?? sites[0]
  const machines = activeSite
    ? await queryGetMachinesBySite(session, { siteId: activeSite.id, search: params.search, status: params.status })
    : []

  const canCreate = can(session.role, "machine:create")

  const exportParams = new URLSearchParams()
  if (activeSite) exportParams.set("siteId", activeSite.id)
  if (params.search) exportParams.set("search", params.search)
  if (params.status) exportParams.set("status", params.status)
  const exportUrl = `/api/export/machines?${exportParams.toString()}`

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-bold text-slate-900">Machines</h1>
          <SiteSwitcher
            sites={sites.map((s) => ({ id: s.id, name: s.name }))}
            currentSiteId={activeSite?.id ?? ""}
          />
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <ExportCsvButton href={exportUrl} />
          {canCreate && (
            <Button asChild size="sm">
              <Link href="/machines/new">
                <Plus className="w-4 h-4 mr-1" />
                Ajouter
              </Link>
            </Button>
          )}
        </div>
      </div>

      <MachineFilters />

      {machines.length === 0 ? (
        <EmptyStatePlaceholder
          icon={Wrench}
          title="Aucune machine enregistrée"
          description="Ajoutez votre première machine pour commencer à suivre la maintenance."
          action={
            canCreate ? (
              <Button asChild size="sm">
                <Link href="/machines/new">Ajouter une machine</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-600">Nom</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Catégorie</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Statut</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Interventions ouvertes</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {machines.map((machine) => (
                <tr key={machine.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/machines/${machine.id}`}
                      className="font-medium text-slate-900 hover:text-blue-600 transition-colors"
                    >
                      {machine.name}
                    </Link>
                    {machine.serialNumber && (
                      <p className="text-xs text-slate-400">{machine.serialNumber}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{machine.category ?? "—"}</td>
                  <td className="px-4 py-3">
                    <MachineStatusBadge status={machine.status} />
                  </td>
                  <td className="px-4 py-3">
                    {machine._count.interventions > 0 ? (
                      <span className="inline-flex items-center gap-1 text-orange-600 font-medium">
                        {machine._count.interventions} ouverte(s)
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/machines/${machine.id}`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Voir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  )
}
