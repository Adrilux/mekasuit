import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { queryGetTenantRoles } from "@/server/queries/roles/query-get-tenant-roles"
import { RolesPageClient } from "@/components/roles/roles-page-client"
import { redirect } from "next/navigation"

export default async function RolesPage() {
  const session = await requireSession()

  if (session.mustChangePassword) redirect("/change-password")

  // Seuls client_admin et au-dessus peuvent gérer les rôles
  try {
    assertCan(session, "role:update")
  } catch {
    redirect("/dashboard")
  }

  const roles = await queryGetTenantRoles(session.tenantId)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Rôles & Permissions</h1>
        <p className="text-sm text-slate-500 mt-1">
          Créez des rôles personnalisés avec des permissions précises pour votre organisation.
        </p>
      </div>
      <RolesPageClient roles={roles} />
    </div>
  )
}
