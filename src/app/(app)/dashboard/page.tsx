import Link from "next/link"
import {
  AlertTriangle,
  Wrench,
  ClipboardList,
  Activity,
  Clock,
  Package,
  CalendarClock,
} from "lucide-react"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { queryGetDashboardStats } from "@/server/queries/dashboard/query-get-dashboard-stats"
import { queryGetSitesByTenant } from "@/server/queries/sites/query-get-sites-by-tenant"
import { buildUserNameMap } from "@/server/queries/users/query-get-users-by-auth-ids"
import { isModuleActive } from "@/lib/modules/module-access-checker"
import { ModuleName } from "@prisma/client"
import { InterventionPriorityBadge } from "@/components/interventions/intervention-priority-badge"
import { InterventionStatusBadge } from "@/components/interventions/intervention-status-badge"

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ siteId?: string }>
}) {
  const { siteId } = await searchParams
  const session = await requireSession()

  const [stockModuleActive, sites] = await Promise.all([
    isModuleActive(session.tenantId, ModuleName.STOCK_MANAGEMENT),
    queryGetSitesByTenant(session),
  ])

  // Filtre de site : si siteId passé en URL et accessible, l'utiliser
  const accessibleSite = siteId ? sites.find((s) => s.id === siteId) : undefined
  const activeSiteId = accessibleSite?.id

  const stats = await queryGetDashboardStats(session, {
    stockModuleActive,
    siteId: activeSiteId,
  })

  // Résolution noms techniciens pour les interventions en retard
  const overdueAssignedIds = stats.overdueInterventions
    .map((i) => i.assignedUserId)
    .filter((id): id is string => !!id)
  const userNameMap = overdueAssignedIds.length > 0
    ? await buildUserNameMap([...new Set(overdueAssignedIds)])
    : new Map<string, string>()

  const showSiteFilter = sites.length > 1

  return (
    <div className="space-y-6">
      {/* Header + filtre site */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">Vue d'ensemble</h1>
        {showSiteFilter && (
          <SiteFilter sites={sites} activeSiteId={activeSiteId} />
        )}
      </div>

      {/* Ligne 1 — KPIs principaux */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Interventions ouvertes"
          value={stats.openInterventions}
          icon={ClipboardList}
          href="/interventions"
          alert={stats.openInterventions > 0}
        />
        <StatCard
          label="Critiques"
          value={stats.criticalInterventions}
          icon={AlertTriangle}
          href="/interventions"
          alert={stats.criticalInterventions > 0}
          alertColor="red"
        />
        <StatCard
          label="En maintenance"
          value={stats.machinesUnderMaintenance}
          icon={Wrench}
          href="/machines"
        />
        <StatCard
          label="Machines actives"
          value={stats.machinesTotal}
          icon={Activity}
          href="/machines"
        />
      </div>

      {/* Ligne 2 — KPIs secondaires */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="En retard"
          value={stats.overdueCount}
          icon={Clock}
          href="/interventions"
          alert={stats.overdueCount > 0}
          alertColor="red"
        />
        <StatCard
          label="Préventives cette semaine"
          value={stats.preventiveThisWeekCount}
          icon={CalendarClock}
          href="/preventive"
          alert={stats.preventiveThisWeekCount > 0}
          alertColor="orange"
        />
        {stockModuleActive && (
          <StatCard
            label="Articles en rupture"
            value={stats.lowStockCount}
            icon={Package}
            href="/stock"
            alert={stats.lowStockCount > 0}
            alertColor="orange"
          />
        )}
      </div>

      {/* Interventions en retard */}
      {stats.overdueInterventions.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-red-200">
            <h2 className="text-sm font-semibold text-red-700 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Interventions en retard ({stats.overdueCount})
            </h2>
            <Link href="/interventions" className="text-xs text-red-600 hover:underline">
              Voir tout
            </Link>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-red-100/50 border-b border-red-200">
                <th className="text-left px-5 py-2.5 font-medium text-red-700">Titre</th>
                <th className="text-left px-5 py-2.5 font-medium text-red-700">Machine</th>
                <th className="text-left px-5 py-2.5 font-medium text-red-700">Site</th>
                <th className="text-left px-5 py-2.5 font-medium text-red-700">Planifiée le</th>
                <th className="text-left px-5 py-2.5 font-medium text-red-700">Technicien</th>
                <th className="text-left px-5 py-2.5 font-medium text-red-700">Priorité</th>
              </tr>
            </thead>
            <tbody>
              {stats.overdueInterventions.map((intervention) => (
                <tr key={intervention.id} className="border-b border-red-100 hover:bg-red-100/30">
                  <td className="px-5 py-3">
                    <Link href={`/interventions/${intervention.id}`} className="font-medium text-red-900 hover:text-red-700">
                      {intervention.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-red-700">{intervention.machine?.name ?? "—"}</td>
                  <td className="px-5 py-3 text-red-700">{intervention.site.name}</td>
                  <td className="px-5 py-3 text-red-700">
                    {intervention.scheduledAt
                      ? new Date(intervention.scheduledAt).toLocaleDateString("fr-FR")
                      : "—"}
                  </td>
                  <td className="px-5 py-3 text-red-700">
                    {intervention.assignedUserId
                      ? (userNameMap.get(intervention.assignedUserId) ?? "—")
                      : "Non assigné"}
                  </td>
                  <td className="px-5 py-3">
                    <InterventionPriorityBadge priority={intervention.priority} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Interventions ouvertes récentes */}
      {stats.recentOpenInterventions.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-700">Interventions à traiter</h2>
            <Link href="/interventions" className="text-xs text-blue-600 hover:underline">
              Voir tout
            </Link>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-3 font-medium text-slate-600">Titre</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600">Machine</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600">Site</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600">Priorité</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600">Statut</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOpenInterventions.map((intervention) => (
                <tr key={intervention.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <Link href={`/interventions/${intervention.id}`} className="font-medium hover:text-blue-600">
                      {intervention.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{intervention.machine?.name ?? "—"}</td>
                  <td className="px-5 py-3 text-slate-600">{intervention.site.name}</td>
                  <td className="px-5 py-3">
                    <InterventionPriorityBadge priority={intervention.priority} />
                  </td>
                  <td className="px-5 py-3">
                    <InterventionStatusBadge status={intervention.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Stock en rupture */}
      {stockModuleActive && stats.lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-amber-200">
            <h2 className="text-sm font-semibold text-amber-700 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Stock en rupture ({stats.lowStockCount})
            </h2>
            <Link href="/stock" className="text-xs text-amber-600 hover:underline">
              Voir tout
            </Link>
          </div>
          <ul className="divide-y divide-amber-100">
            {stats.lowStockItems.map((item) => (
              <li key={item.id} className="px-5 py-3 flex items-center justify-between hover:bg-amber-100/30">
                <div>
                  <Link href={`/stock/${item.id}`} className="text-sm font-medium text-amber-900 hover:text-amber-700">
                    {item.name}
                  </Link>
                  <p className="text-xs text-amber-600">{item.reference} · {item.site.name}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-red-700">{item.quantityOnHand}</span>
                  <span className="text-xs text-amber-600"> / min {item.minimumLevel} {item.unit}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* État idéal */}
      {stats.openInterventions === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-5 py-4 text-sm text-green-700">
          Aucune intervention ouverte. Tout est opérationnel.
        </div>
      )}
    </div>
  )
}

// --- Composants locaux ---

function StatCard({
  label,
  value,
  icon: Icon,
  href,
  alert = false,
  alertColor = "orange",
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  href: string
  alert?: boolean
  alertColor?: "orange" | "red"
}) {
  const alertClass =
    alertColor === "red" ? "border-red-200 bg-red-50" : "border-orange-200 bg-orange-50"

  return (
    <Link
      href={href}
      className={`flex flex-col gap-3 p-4 rounded-lg border transition-colors hover:shadow-sm ${
        alert ? alertClass : "bg-white border-slate-200 hover:border-slate-300"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">{label}</span>
        <Icon
          className={`w-4 h-4 ${
            alert
              ? alertColor === "red"
                ? "text-red-500"
                : "text-orange-500"
              : "text-slate-400"
          }`}
        />
      </div>
      <span
        className={`text-3xl font-bold ${
          alert
            ? alertColor === "red"
              ? "text-red-700"
              : "text-orange-700"
            : "text-slate-900"
        }`}
      >
        {value}
      </span>
    </Link>
  )
}

function SiteFilter({
  sites,
  activeSiteId,
}: {
  sites: { id: string; name: string }[]
  activeSiteId?: string
}) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      <Link
        href="/dashboard"
        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
          !activeSiteId
            ? "bg-blue-100 text-blue-700"
            : "text-slate-500 hover:bg-slate-100"
        }`}
      >
        Tous
      </Link>
      {sites.map((site) => (
        <Link
          key={site.id}
          href={`/dashboard?siteId=${site.id}`}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            activeSiteId === site.id
              ? "bg-blue-100 text-blue-700"
              : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          {site.name}
        </Link>
      ))}
    </div>
  )
}
