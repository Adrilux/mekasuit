import { requireSuperAdmin } from "@/lib/auth/auth-session-helpers"
import { queryGetAllTenants } from "@/server/queries/super-admin/query-get-all-tenants"
import { queryGetAdminGlobalStats } from "@/server/queries/super-admin/query-get-admin-global-stats"
import { CreateTenantDialog } from "@/components/super-admin/create-tenant-dialog"
import { AdminTenantsClient } from "@/components/super-admin/admin-tenants-client"
import { Building2, Users, MapPin, CalendarDays, ClipboardList } from "lucide-react"

export default async function AdminPage() {
  await requireSuperAdmin()
  const [tenants, globalStats] = await Promise.all([
    queryGetAllTenants(),
    queryGetAdminGlobalStats(),
  ])

  const activeTenants = tenants.filter((t) => t.isActive)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-300">Tenants</h2>
        <CreateTenantDialog />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <AdminStatCard label="Tenants actifs" value={activeTenants.length} icon={Building2} />
        <AdminStatCard
          label="Total utilisateurs"
          value={tenants.reduce((sum, t) => sum + t._count.tenantUsers, 0)}
          icon={Users}
        />
        <AdminStatCard
          label="Total sites"
          value={tenants.reduce((sum, t) => sum + t._count.sites, 0)}
          icon={MapPin}
        />
        <AdminStatCard
          label="Interventions ouvertes"
          value={globalStats.openInterventions}
          icon={ClipboardList}
          alert={globalStats.openInterventions > 0}
        />
        <AdminStatCard
          label="Nouveaux ce mois"
          value={globalStats.tenantsThisMonth}
          icon={CalendarDays}
        />
      </div>

      {/* Liste tenants avec recherche */}
      <AdminTenantsClient tenants={tenants} />
    </div>
  )
}

function AdminStatCard({
  label,
  value,
  icon: Icon,
  alert = false,
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  alert?: boolean
}) {
  return (
    <div className={`rounded-lg p-4 border bg-slate-900 ${alert ? "border-amber-800" : "border-slate-800"}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-slate-500">{label}</p>
        <Icon className={`w-3.5 h-3.5 ${alert ? "text-amber-500" : "text-slate-600"}`} />
      </div>
      <p className={`text-2xl font-bold ${alert ? "text-amber-400" : "text-white"}`}>{value}</p>
    </div>
  )
}
