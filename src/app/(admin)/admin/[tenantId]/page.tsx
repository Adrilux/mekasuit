import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Building2, Wrench, Package, ClipboardList } from "lucide-react"
import { requireSuperAdmin } from "@/lib/auth/auth-session-helpers"
import { prisma } from "@/lib/db/prisma-client-singleton"
import { queryGetTenantDetail } from "@/server/queries/super-admin/query-get-tenant-detail"
import { TenantCard } from "@/components/super-admin/tenant-card"
import { TenantSitesSection } from "@/components/super-admin/tenant-sites-section"
import { TenantUsersSection } from "@/components/super-admin/tenant-users-section"
import { LinkUserDialog } from "@/components/super-admin/link-user-dialog"
import { AddSiteDialog } from "@/components/super-admin/add-site-dialog"

type Props = {
  params: Promise<{ tenantId: string }>
}

export default async function AdminTenantDetailPage({ params }: Props) {
  await requireSuperAdmin()

  const { tenantId } = await params

  const tenant = await queryGetTenantDetail(tenantId)
  if (!tenant) {
    notFound()
  }

  // Resolve Better Auth user names and emails for all tenant users
  const authUserIds = tenant.tenantUsers.map((u) => u.authUserId)
  const authUsers =
    authUserIds.length > 0
      ? await prisma.$queryRaw<{ id: string; name: string; email: string }[]>`
          SELECT id, name, email FROM "user" WHERE id = ANY(${authUserIds}::text[])
        `
      : []

  const userMap = Object.fromEntries(authUsers.map((u) => [u.id, u]))

  const usersWithNames = tenant.tenantUsers.map((tu) => ({
    ...tu,
    name: userMap[tu.authUserId]?.name ?? tu.authUserId,
    email: userMap[tu.authUserId]?.email ?? "",
  }))

  // Aggrégats calculés depuis les sites (pas de requête supplémentaire)
  const totalMachines = tenant.sites.reduce((s, site) => s + site._count.machines, 0)
  const totalStockItems = tenant.sites.reduce((s, site) => s + site._count.stockItems, 0)
  const totalInterventions = tenant.sites.reduce((s, site) => s + site._count.interventions, 0)

  // Shape tenant for TenantCard (which expects _count)
  const tenantForCard = {
    ...tenant,
    _count: {
      sites: tenant.sites.length,
      tenantUsers: tenant.tenantUsers.length,
    },
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux tenants
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">{tenant.name}</h1>
              <span className="text-xs font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                {tenant.slug}
              </span>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  tenant.isActive
                    ? "bg-green-900 text-green-400"
                    : "bg-red-900 text-red-400"
                }`}
              >
                {tenant.isActive ? "Actif" : "Inactif"}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Créé le {new Date(tenant.createdAt).toLocaleDateString("fr-FR")}
            </p>
          </div>
        </div>
      </div>

      {/* Mini stats tenant */}
      <div className="grid grid-cols-3 gap-3">
        <TenantStatCard label="Machines" value={totalMachines} icon={Wrench} />
        <TenantStatCard label="Articles en stock" value={totalStockItems} icon={Package} />
        <TenantStatCard label="Interventions ouvertes" value={totalInterventions} icon={ClipboardList} alert={totalInterventions > 0} />
      </div>

      {/* Section 1 — Informations & Licence */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">
          Informations, licence & modules
        </h2>
        <TenantCard tenant={tenantForCard} />
      </div>

      {/* Section 2 — Sites */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-300">
            Sites ({tenant.sites.length})
          </h2>
          <AddSiteDialog tenantId={tenant.id} />
        </div>
        <TenantSitesSection tenantId={tenant.id} sites={tenant.sites} />
      </div>

      {/* Section 3 — Utilisateurs liés */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-300">
            Utilisateurs liés ({usersWithNames.length})
          </h2>
          <LinkUserDialog tenantId={tenant.id} tenantName={tenant.name} />
        </div>
        <TenantUsersSection tenantId={tenant.id} users={usersWithNames} />
      </div>
    </div>
  )
}

function TenantStatCard({
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
    <div className={`rounded-lg p-4 border ${alert ? "bg-slate-900 border-amber-800" : "bg-slate-900 border-slate-800"}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-slate-500">{label}</p>
        <Icon className={`w-3.5 h-3.5 ${alert ? "text-amber-500" : "text-slate-600"}`} />
      </div>
      <p className={`text-2xl font-bold ${alert ? "text-amber-400" : "text-white"}`}>{value}</p>
    </div>
  )
}
