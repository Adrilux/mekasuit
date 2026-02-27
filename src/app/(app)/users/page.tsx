import Link from "next/link"
import { Plus, Network } from "lucide-react"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { queryGetUsersByTenant } from "@/server/queries/users/query-get-users-by-tenant"
import { queryGetSitesByTenant } from "@/server/queries/sites/query-get-sites-by-tenant"
import { queryGetTenantRoles } from "@/server/queries/roles/query-get-tenant-roles"
import { Button } from "@/components/ui/button"
import { UsersTable } from "@/components/users/users-table"
import { can } from "@/lib/permissions/permission-matrix"

export default async function UsersPage() {
  const session = await requireSession()
  assertCan(session.role, "user:read")

  const [users, sites, customRoles] = await Promise.all([
    queryGetUsersByTenant(session),
    queryGetSitesByTenant(session),
    queryGetTenantRoles(session.tenantId),
  ])

  const canInvite = can(session.role, "user:invite")
  const canEdit = can(session.role, "user:update-role")
  const canDeactivate = can(session.role, "user:deactivate")

  const allSites = sites.map((s) => ({ id: s.id, name: s.name }))
  const allCustomRoles = customRoles.map((r) => ({ id: r.id, name: r.name }))

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Utilisateurs</h1>
          <p className="text-sm text-slate-500 mt-0.5">{users.length} membre{users.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/users/org">
              <Network className="w-4 h-4 mr-1" />
              Organigramme
            </Link>
          </Button>
          {canInvite && (
            <Button asChild size="sm">
              <Link href="/users/invite">
                <Plus className="w-4 h-4 mr-1" />
                Ajouter un membre
              </Link>
            </Button>
          )}
        </div>
      </div>

      <UsersTable
        users={users}
        allSites={allSites}
        allCustomRoles={allCustomRoles}
        sessionUserId={session.id}
        canEdit={canEdit}
        canDeactivate={canDeactivate}
      />
    </div>
  )
}
