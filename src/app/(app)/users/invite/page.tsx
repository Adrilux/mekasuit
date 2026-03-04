import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { queryGetSitesByTenant } from "@/server/queries/sites/query-get-sites-by-tenant"
import { queryGetTenantRoles } from "@/server/queries/roles/query-get-tenant-roles"
import { InviteUserForm } from "@/components/users/invite-user-form"

export default async function InviteUserPage() {
  const session = await requireSession()
  assertCan(session, "user:invite")

  const [sites, roles] = await Promise.all([
    queryGetSitesByTenant(session),
    queryGetTenantRoles(session.tenantId),
  ])

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-bold text-slate-900 mb-6">Inviter un utilisateur</h1>
      <InviteUserForm
        sites={sites.filter((s) => s.isActive)}
        roles={roles.map((r) => ({ id: r.id, name: r.name }))}
      />
    </div>
  )
}
