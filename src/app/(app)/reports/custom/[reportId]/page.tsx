import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Pencil, Printer } from "lucide-react"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { isModuleActive } from "@/lib/modules/module-access-checker"
import { queryGetCustomReportById } from "@/server/queries/reports/query-get-custom-reports"
import { queryGetSitesByTenant } from "@/server/queries/sites/query-get-sites-by-tenant"
import {
  queryGetMtbfBySite,
  queryGetMaintenanceCostBySite,
} from "@/server/queries/reports/query-get-maintenance-reports"
import { queryGetAvailability } from "@/server/queries/reports/query-get-availability"
import { queryGetSlaReport } from "@/server/queries/reports/query-get-sla-report"
import { Button } from "@/components/ui/button"
import { ModuleName } from "@prisma/client"
import { AVAILABLE_COLUMNS } from "@/components/reports/custom-report-builder"

function formatValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return "—"
  switch (key) {
    case "mtbfHours":
    case "downtimeHours":
    case "avgResponseHours": {
      const h = Number(value)
      if (h < 24) return `${h.toFixed(1)} h`
      const d = h / 24
      if (d < 30) return `${d.toFixed(1)} j`
      return `${(d / 30).toFixed(1)} mois`
    }
    case "availabilityRate":
    case "slaRate":
      return `${Number(value).toFixed(1)} %`
    case "totalCostCents":
      return `${(Number(value) / 100).toFixed(2)} €`
    default:
      return String(value)
  }
}

export default async function CustomReportDetailPage({
  params,
}: {
  params: Promise<{ reportId: string }>
}) {
  const { reportId } = await params
  const session = await requireSession()
  assertCan(session.role, "report:read")

  const moduleActive = await isModuleActive(session.tenantId, ModuleName.ADVANCED_REPORTS)
  if (!moduleActive) notFound()

  const report = await queryGetCustomReportById(session, reportId)
  if (!report) notFound()

  const sites = await queryGetSitesByTenant(session)

  const siteId = report.filters.siteId ?? sites.find((s) => s.isActive)?.id ?? sites[0]?.id ?? ""
  const from = report.filters.from ? new Date(report.filters.from) : undefined
  const to = report.filters.to ? new Date(report.filters.to + "T23:59:59") : undefined
  const siteName = sites.find((s) => s.id === siteId)?.name ?? siteId

  const filter = { siteId, from, to }
  const cols = new Set(report.columns)

  // Load only the sources needed based on selected columns
  const needsMtbf = cols.has("machineName") || cols.has("mtbfHours") || cols.has("interventionCount")
  const needsAvailability = cols.has("downtimeHours") || cols.has("availabilityRate")
  const needsCost = cols.has("totalCostCents") || cols.has("partsConsumed")
  const needsSla = cols.has("slaRate") || cols.has("avgResponseHours")

  const [mtbfData, availabilityData, costData, slaData] = await Promise.all([
    needsMtbf ? queryGetMtbfBySite(session, filter) : Promise.resolve([]),
    needsAvailability ? queryGetAvailability(session, filter) : Promise.resolve([]),
    needsCost ? queryGetMaintenanceCostBySite(session, filter) : Promise.resolve([]),
    needsSla ? queryGetSlaReport(session, filter) : Promise.resolve([]),
  ])

  // Merge data into rows keyed by machineId where applicable
  type DataRow = Record<string, unknown>
  const machineMap = new Map<string, DataRow>()

  for (const r of mtbfData) {
    machineMap.set(r.machineId, {
      ...machineMap.get(r.machineId),
      machineName: r.machineName,
      mtbfHours: r.mtbfHours,
      interventionCount: r.interventionCount,
    })
  }

  for (const r of availabilityData) {
    machineMap.set(r.machineId, {
      ...machineMap.get(r.machineId),
      machineName: r.machineName,
      downtimeHours: r.downtimeHours,
      availabilityRate: r.availabilityRate,
    })
  }

  for (const r of costData) {
    machineMap.set(r.machineId, {
      ...machineMap.get(r.machineId),
      machineName: r.machineName,
      totalCostCents: r.totalCostCents,
      partsConsumed: r.partsConsumed,
    })
  }

  // SLA rows are priority-based, not machine-based — add as separate section if needed
  const slaRows = slaData.filter((r) => r.total > 0).map((r) => ({
    machineName: r.priorityLabel,
    slaRate: r.slaRate,
    avgResponseHours: r.avgResponseHours,
    interventionCount: r.total,
  }))

  let rows: DataRow[]
  if (needsSla && !needsMtbf && !needsAvailability && !needsCost) {
    rows = slaRows
  } else if (machineMap.size > 0) {
    rows = Array.from(machineMap.values())
    // Inject SLA data if needed (sla is per-priority, not per-machine — show avg across priorities)
    if (needsSla && slaRows.length > 0) {
      const avgSlaRate = slaRows.reduce((s, r) => s + (r.slaRate as number), 0) / slaRows.length
      const avgResponse = slaRows.reduce((s, r) => s + (r.avgResponseHours as number), 0) / slaRows.length
      rows = rows.map((r) => ({ ...r, slaRate: avgSlaRate, avgResponseHours: avgResponse }))
    }
  } else {
    rows = slaRows
  }

  // Filter columns to only those in report.columns, preserving AVAILABLE_COLUMNS order
  const activeColumns = AVAILABLE_COLUMNS.filter((c) => cols.has(c.key))

  const printParams = new URLSearchParams()
  if (siteId) printParams.set("siteId", siteId)
  if (report.filters.from) printParams.set("from", report.filters.from)
  if (report.filters.to) printParams.set("to", report.filters.to)
  const printUrl = `/reports/print?${printParams.toString()}`

  const periodLabel = from || to
    ? `${from ? from.toLocaleDateString("fr-FR") : "…"} → ${to ? to.toLocaleDateString("fr-FR") : "aujourd'hui"}`
    : "Toutes les périodes"

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/reports/custom" className="text-slate-500 hover:text-slate-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-slate-900 flex-1">{report.name}</h1>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <a href={printUrl} target="_blank" rel="noreferrer">
              <Printer className="w-4 h-4 mr-1.5" />
              PDF
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/reports/custom/${reportId}/edit`}>
              <Pencil className="w-4 h-4 mr-1.5" />
              Modifier
            </Link>
          </Button>
        </div>
      </div>

      <p className="text-sm text-slate-500 mb-4">
        Site : <span className="font-medium text-slate-700">{siteName}</span>
        {" · "}
        Période : <span className="font-medium text-slate-700">{periodLabel}</span>
      </p>

      {rows.length === 0 ? (
        <div className="text-center py-12 bg-white border border-slate-200 rounded-lg">
          <p className="text-slate-500">Aucune donnée disponible pour ces filtres.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {activeColumns.map((col) => (
                    <th
                      key={col.key}
                      className={`px-4 py-3 font-medium text-slate-600 ${
                        col.key === "machineName" ? "text-left" : "text-right"
                      }`}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                    {activeColumns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-4 py-3 ${
                          col.key === "machineName"
                            ? "font-medium text-slate-900"
                            : "text-right text-slate-700"
                        }`}
                      >
                        {formatValue(col.key, row[col.key])}
                      </td>
                    ))}
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
