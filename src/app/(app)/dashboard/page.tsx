import Link from "next/link"
import {
  AlertTriangle,
  Wrench,
  ClipboardList,
  Activity,
  Clock,
  Package,
  CalendarClock,
  ChevronRight,
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

  const accessibleSite = siteId ? sites.find((s) => s.id === siteId) : undefined
  const activeSiteId = accessibleSite?.id

  const stats = await queryGetDashboardStats(session, {
    stockModuleActive,
    siteId: activeSiteId,
  })

  const overdueAssignedIds = stats.overdueInterventions
    .map((i) => i.assignedUserId)
    .filter((id): id is string => !!id)
  const userNameMap = overdueAssignedIds.length > 0
    ? await buildUserNameMap([...new Set(overdueAssignedIds)])
    : new Map<string, string>()

  const showSiteFilter = sites.length > 1
  const hasAlerts = stats.overdueCount > 0 || stats.criticalInterventions > 0 || (stockModuleActive && stats.lowStockCount > 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">Vue d'ensemble</h1>
        {showSiteFilter && <SiteFilter sites={sites} activeSiteId={activeSiteId} />}
      </div>

      {/* KPIs — 4 tuiles neutres */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Interventions ouvertes"
          value={stats.openInterventions}
          icon={ClipboardList}
          href="/interventions"
          highlight={stats.openInterventions > 0}
        />
        <KpiCard
          label="En maintenance"
          value={stats.machinesUnderMaintenance}
          icon={Wrench}
          href="/machines"
        />
        <KpiCard
          label="Préventives cette semaine"
          value={stats.preventiveThisWeekCount}
          icon={CalendarClock}
          href="/planning"
        />
        <KpiCard
          label="Machines actives"
          value={stats.machinesTotal}
          icon={Activity}
          href="/machines"
        />
      </div>

      {/* Bandeau d'alertes — compact, une seule section */}
      {hasAlerts && (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Points d'attention
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {stats.overdueCount > 0 && (
              <AlertRow
                icon={Clock}
                label={`${stats.overdueCount} intervention${stats.overdueCount > 1 ? "s" : ""} en retard`}
                href="/interventions"
                level="high"
              />
            )}
            {stats.criticalInterventions > 0 && (
              <AlertRow
                icon={AlertTriangle}
                label={`${stats.criticalInterventions} intervention${stats.criticalInterventions > 1 ? "s" : ""} critique${stats.criticalInterventions > 1 ? "s" : ""}`}
                href="/interventions"
                level="high"
              />
            )}
            {stockModuleActive && stats.lowStockCount > 0 && (
              <AlertRow
                icon={Package}
                label={`${stats.lowStockCount} article${stats.lowStockCount > 1 ? "s" : ""} en rupture de stock`}
                href="/stock"
                level="medium"
              />
            )}
          </div>
        </div>
      )}

      {/* Interventions en retard */}
      {stats.overdueInterventions.length > 0 && (
        <Section
          title={`En retard (${stats.overdueCount})`}
          href="/interventions"
          icon={Clock}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-2.5 font-medium text-slate-600">Titre</th>
                <th className="text-left px-5 py-2.5 font-medium text-slate-600 hidden sm:table-cell">Machine</th>
                <th className="text-left px-5 py-2.5 font-medium text-slate-600 hidden md:table-cell">Site</th>
                <th className="text-left px-5 py-2.5 font-medium text-slate-600 hidden md:table-cell">Planifiée</th>
                <th className="text-left px-5 py-2.5 font-medium text-slate-600">Priorité</th>
              </tr>
            </thead>
            <tbody>
              {stats.overdueInterventions.map((intervention) => (
                <tr key={intervention.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <Link href={`/interventions/${intervention.id}`} className="font-medium text-slate-900 hover:text-blue-600">
                      {intervention.title}
                    </Link>
                    <p className="text-xs text-slate-400 sm:hidden">{intervention.machine?.name ?? "—"}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600 hidden sm:table-cell">{intervention.machine?.name ?? "—"}</td>
                  <td className="px-5 py-3 text-slate-600 hidden md:table-cell">{intervention.site.name}</td>
                  <td className="px-5 py-3 text-slate-500 hidden md:table-cell">
                    {intervention.scheduledAt
                      ? new Date(intervention.scheduledAt).toLocaleDateString("fr-FR")
                      : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <InterventionPriorityBadge priority={intervention.priority} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {/* Interventions ouvertes récentes */}
      {stats.recentOpenInterventions.length > 0 && (
        <Section title="À traiter" href="/interventions">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-2.5 font-medium text-slate-600">Titre</th>
                <th className="text-left px-5 py-2.5 font-medium text-slate-600 hidden sm:table-cell">Machine</th>
                <th className="text-left px-5 py-2.5 font-medium text-slate-600 hidden md:table-cell">Site</th>
                <th className="text-left px-5 py-2.5 font-medium text-slate-600">Priorité</th>
                <th className="text-left px-5 py-2.5 font-medium text-slate-600 hidden sm:table-cell">Statut</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOpenInterventions.map((intervention) => (
                <tr key={intervention.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <Link href={`/interventions/${intervention.id}`} className="font-medium text-slate-900 hover:text-blue-600">
                      {intervention.title}
                    </Link>
                    <p className="text-xs text-slate-400 sm:hidden">{intervention.machine?.name ?? "—"}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600 hidden sm:table-cell">{intervention.machine?.name ?? "—"}</td>
                  <td className="px-5 py-3 text-slate-600 hidden md:table-cell">{intervention.site.name}</td>
                  <td className="px-5 py-3">
                    <InterventionPriorityBadge priority={intervention.priority} />
                  </td>
                  <td className="px-5 py-3 hidden sm:table-cell">
                    <InterventionStatusBadge status={intervention.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {/* Stock en rupture */}
      {stockModuleActive && stats.lowStockItems.length > 0 && (
        <Section
          title={`Ruptures de stock (${stats.lowStockCount})`}
          href="/stock"
          icon={Package}
        >
          <div className="divide-y divide-slate-100">
            {stats.lowStockItems.map((item) => (
              <Link
                key={item.id}
                href={`/stock/${item.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-400">{item.reference} · {item.site.name}</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <span className="text-sm font-bold text-slate-900">{item.quantityOnHand}</span>
                  <span className="text-xs text-slate-400"> / min {item.minimumLevel} {item.unit}</span>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* État idéal */}
      {stats.openInterventions === 0 && (
        <div className="border border-green-200 bg-green-50 rounded-lg px-5 py-4 text-sm text-green-700">
          Aucune intervention ouverte. Tout est opérationnel.
        </div>
      )}
    </div>
  )
}

// --- Composants locaux ---

function KpiCard({
  label,
  value,
  icon: Icon,
  href,
  highlight = false,
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  href: string
  highlight?: boolean
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-3 p-4 rounded-lg border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">{label}</span>
        <Icon className="w-4 h-4 text-slate-300" />
      </div>
      <span className={`text-3xl font-bold ${highlight ? "text-slate-900" : "text-slate-700"}`}>
        {value}
      </span>
    </Link>
  )
}

function AlertRow({
  icon: Icon,
  label,
  href,
  level,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  href: string
  level: "high" | "medium"
}) {
  const iconColor = level === "high" ? "text-red-500" : "text-amber-500"
  const textColor = level === "high" ? "text-red-700" : "text-amber-700"

  return (
    <Link
      href={href}
      className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <Icon className={`w-4 h-4 shrink-0 ${iconColor}`} />
        <span className={`text-sm font-medium ${textColor}`}>{label}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-400" />
    </Link>
  )
}

function Section({
  title,
  href,
  icon: Icon,
  children,
}: {
  title: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-white">
        <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-slate-400" />}
          {title}
        </h2>
        <Link href={href} className="text-xs text-blue-600 hover:underline flex items-center gap-0.5">
          Voir tout <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
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
          !activeSiteId ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"
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
              ? "bg-slate-900 text-white"
              : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          {site.name}
        </Link>
      ))}
    </div>
  )
}
