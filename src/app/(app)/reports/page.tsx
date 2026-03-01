import Link from "next/link"
import { FileDown, LayoutList } from "lucide-react"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { queryGetSitesByTenant } from "@/server/queries/sites/query-get-sites-by-tenant"
import { buildUserNameMap } from "@/server/queries/users/query-get-users-by-auth-ids"
import {
  queryGetMtbfBySite,
  queryGetTechnicianLoad,
  queryGetMaintenanceCostBySite,
} from "@/server/queries/reports/query-get-maintenance-reports"
import { queryGetAvailability } from "@/server/queries/reports/query-get-availability"
import { queryGetSlaReport } from "@/server/queries/reports/query-get-sla-report"
import { SiteSwitcher } from "@/components/layout/site-switcher"
import { ReportDateFilter } from "@/components/reports/report-date-filter"
import { TechLoadChart } from "@/components/reports/tech-load-chart"
import { CostPieChart } from "@/components/reports/cost-pie-chart"
import { AvailabilityChart } from "@/components/reports/availability-chart"
import { SlaChart } from "@/components/reports/sla-chart"
import { Button } from "@/components/ui/button"

function formatHours(hours: number): string {
  if (hours < 24) return `${hours.toFixed(1)} h`
  const days = hours / 24
  if (days < 30) return `${days.toFixed(1)} j`
  return `${(days / 30).toFixed(1)} mois`
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ siteId?: string; from?: string; to?: string }>
}) {
  const params = await searchParams
  const session = await requireSession()
  const sites = await queryGetSitesByTenant(session)

  const activeSite = (params.siteId ? sites.find((s) => s.id === params.siteId) : null)
    ?? sites.find((s) => s.isActive)
    ?? sites[0]

  const from = params.from ? new Date(params.from) : undefined
  const to = params.to ? new Date(params.to + "T23:59:59") : undefined

  const filter = { siteId: activeSite?.id ?? "", from, to }

  const [mtbf, techLoad, costs, availability, sla] = activeSite
    ? await Promise.all([
        queryGetMtbfBySite(session, filter),
        queryGetTechnicianLoad(session, filter),
        queryGetMaintenanceCostBySite(session, filter),
        queryGetAvailability(session, filter),
        queryGetSlaReport(session, filter),
      ])
    : [[], [], [], [], []]

  const techIds = techLoad.map((t) => t.userId)
  const techNamesMap = await buildUserNameMap(techIds)
  const techNames = Object.fromEntries(techNamesMap.entries())

  const totalCostCents = costs.reduce((sum, c) => sum + c.totalCostCents, 0)

  // Build print URL
  const printParams = new URLSearchParams()
  if (activeSite?.id) printParams.set("siteId", activeSite.id)
  if (params.from) printParams.set("from", params.from)
  if (params.to) printParams.set("to", params.to)
  const printUrl = `/reports/print?${printParams.toString()}`

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-bold text-slate-900">Rapports</h1>
          <SiteSwitcher
            sites={sites.map((s) => ({ id: s.id, name: s.name }))}
            currentSiteId={activeSite?.id ?? ""}
          />
        </div>
        <div className="flex items-center gap-2">
          {(from || to) && (
            <p className="text-sm text-slate-500">
              {from ? from.toLocaleDateString("fr-FR") : "…"} → {to ? to.toLocaleDateString("fr-FR") : "aujourd'hui"}
            </p>
          )}
          <Button asChild variant="outline" size="sm">
            <Link href="/reports/custom">
              <LayoutList className="w-4 h-4 mr-1.5" />
              Rapports custom
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={printUrl} target="_blank">
              <FileDown className="w-4 h-4 mr-1.5" />
              Exporter PDF
            </Link>
          </Button>
        </div>
      </div>

      <ReportDateFilter />

      {!activeSite ? (
        <p className="text-slate-500 text-sm">Aucun site disponible.</p>
      ) : (
        <div className="space-y-8">
          {/* MTBF */}
          <section>
            <h2 className="text-base font-semibold text-slate-800 mb-3">
              MTBF — Temps moyen entre pannes correctives
            </h2>
            {mtbf.length === 0 ? (
              <p className="text-sm text-slate-400">Pas assez de données pour calculer le MTBF (minimum 2 interventions correctives fermées par machine).</p>
            ) : (
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left px-4 py-3 font-medium text-slate-600">Machine</th>
                        <th className="text-right px-4 py-3 font-medium text-slate-600">Pannes</th>
                        <th className="text-right px-4 py-3 font-medium text-slate-600">MTBF</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mtbf.map((row) => (
                        <tr key={row.machineId} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">{row.machineName}</td>
                          <td className="px-4 py-3 text-right text-slate-700">{row.interventionCount}</td>
                          <td className="px-4 py-3 text-right">
                            {row.mtbfHours !== null ? (
                              <span className={`font-semibold ${row.mtbfHours < 168 ? "text-red-600" : row.mtbfHours < 720 ? "text-amber-600" : "text-green-600"}`}>
                                {formatHours(row.mtbfHours)}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">insuffisant</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {/* Taux de disponibilité */}
          <section>
            <h2 className="text-base font-semibold text-slate-800 mb-3">
              Taux de disponibilité des machines
            </h2>
            <p className="text-xs text-slate-400 mb-3">Basé sur la durée des interventions correctives (de l&apos;ouverture à la clôture)</p>
            {availability.length === 0 ? (
              <p className="text-sm text-slate-400">Aucune intervention corrective clôturée sur cette période.</p>
            ) : (
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <AvailabilityChart data={availability} />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left px-4 py-3 font-medium text-slate-600">Machine</th>
                        <th className="text-right px-4 py-3 font-medium text-slate-600">Incidents</th>
                        <th className="text-right px-4 py-3 font-medium text-slate-600">Temps d&apos;arrêt</th>
                        <th className="text-right px-4 py-3 font-medium text-slate-600">Disponibilité</th>
                      </tr>
                    </thead>
                    <tbody>
                      {availability.map((row) => (
                        <tr key={row.machineId} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">{row.machineName}</td>
                          <td className="px-4 py-3 text-right text-slate-700">{row.incidentCount}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{formatHours(row.downtimeHours)}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-semibold ${row.availabilityRate >= 95 ? "text-green-600" : row.availabilityRate >= 80 ? "text-amber-600" : "text-red-600"}`}>
                              {row.availabilityRate} %
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {/* SLA */}
          <section>
            <h2 className="text-base font-semibold text-slate-800 mb-3">
              Respect des délais SLA
            </h2>
            <p className="text-xs text-slate-400 mb-3">Délais cibles : Critique 4h · Haute 24h · Moyenne 72h · Basse 168h</p>
            {sla.every((r) => r.total === 0) ? (
              <p className="text-sm text-slate-400">Aucune intervention clôturée sur cette période.</p>
            ) : (
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <SlaChart data={sla} />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left px-4 py-3 font-medium text-slate-600">Priorité</th>
                        <th className="text-right px-4 py-3 font-medium text-slate-600">SLA cible</th>
                        <th className="text-right px-4 py-3 font-medium text-slate-600">Total</th>
                        <th className="text-right px-4 py-3 font-medium text-slate-600">Dans les délais</th>
                        <th className="text-right px-4 py-3 font-medium text-slate-600">Taux SLA</th>
                        <th className="text-right px-4 py-3 font-medium text-slate-600">Délai moyen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sla.map((row) => (
                        <tr key={row.priority} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">{row.priorityLabel}</td>
                          <td className="px-4 py-3 text-right text-slate-500">{formatHours(row.slaLimitHours)}</td>
                          <td className="px-4 py-3 text-right text-slate-700">{row.total || "—"}</td>
                          <td className="px-4 py-3 text-right text-green-600">{row.withinSla || "—"}</td>
                          <td className="px-4 py-3 text-right">
                            {row.total > 0 ? (
                              <span className={`font-semibold ${row.slaRate >= 90 ? "text-green-600" : row.slaRate >= 70 ? "text-amber-600" : "text-red-600"}`}>
                                {row.slaRate} %
                              </span>
                            ) : "—"}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-500">
                            {row.total > 0 ? formatHours(row.avgResponseHours) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {/* Charge technicien */}
          <section>
            <h2 className="text-base font-semibold text-slate-800 mb-3">
              Charge par technicien
            </h2>
            {techLoad.length === 0 ? (
              <p className="text-sm text-slate-400">Aucune intervention assignée sur cette période.</p>
            ) : (
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <TechLoadChart data={techLoad} techNames={techNames} />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left px-4 py-3 font-medium text-slate-600">Technicien</th>
                        <th className="text-right px-4 py-3 font-medium text-slate-600">Total</th>
                        <th className="text-right px-4 py-3 font-medium text-slate-600">Ouvertes</th>
                        <th className="text-right px-4 py-3 font-medium text-slate-600">Fermées</th>
                        <th className="text-right px-4 py-3 font-medium text-slate-600">Correctives</th>
                        <th className="text-right px-4 py-3 font-medium text-slate-600">Préventives</th>
                        <th className="text-right px-4 py-3 font-medium text-slate-600">Critiques</th>
                      </tr>
                    </thead>
                    <tbody>
                      {techLoad
                        .sort((a, b) => b.total - a.total)
                        .map((row) => (
                          <tr key={row.userId} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="px-4 py-3 font-medium text-slate-900">
                              {techNames[row.userId] ?? row.userId.slice(0, 8) + "…"}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-900">{row.total}</td>
                            <td className="px-4 py-3 text-right text-amber-600">{row.open || "—"}</td>
                            <td className="px-4 py-3 text-right text-green-600">{row.closed || "—"}</td>
                            <td className="px-4 py-3 text-right text-slate-600">{row.corrective || "—"}</td>
                            <td className="px-4 py-3 text-right text-slate-600">{row.preventive || "—"}</td>
                            <td className="px-4 py-3 text-right text-red-600 font-medium">{row.critical || "—"}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {/* Coût maintenance */}
          <section>
            <h2 className="text-base font-semibold text-slate-800 mb-1">
              Coût de maintenance par machine
            </h2>
            {totalCostCents > 0 && (
              <p className="text-sm text-slate-500 mb-3">
                Total sur la période : <span className="font-semibold text-slate-900">{(totalCostCents / 100).toFixed(2)} €</span>
              </p>
            )}
            {costs.length === 0 ? (
              <p className="text-sm text-slate-400">Aucune pièce consommée avec un coût renseigné.</p>
            ) : (
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <CostPieChart data={costs} totalCostCents={totalCostCents} />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left px-4 py-3 font-medium text-slate-600">Machine</th>
                        <th className="text-right px-4 py-3 font-medium text-slate-600">Pièces consommées</th>
                        <th className="text-right px-4 py-3 font-medium text-slate-600">Coût total</th>
                        <th className="text-right px-4 py-3 font-medium text-slate-600">% du total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {costs.map((row) => (
                        <tr key={row.machineId} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">{row.machineName}</td>
                          <td className="px-4 py-3 text-right text-slate-700">{row.partsConsumed}</td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900">
                            {(row.totalCostCents / 100).toFixed(2)} €
                          </td>
                          <td className="px-4 py-3 text-right text-slate-500">
                            {totalCostCents > 0 ? `${((row.totalCostCents / totalCostCents) * 100).toFixed(1)} %` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
