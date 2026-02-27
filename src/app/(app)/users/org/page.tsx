import Link from "next/link"
import { ArrowLeft, Network } from "lucide-react"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { queryGetUsersByTenant } from "@/server/queries/users/query-get-users-by-tenant"
import { OrgChart } from "@/components/users/org-chart"
import { can } from "@/lib/permissions/permission-matrix"

export default async function OrgChartPage() {
  const session = await requireSession()
  assertCan(session.role, "user:read")

  const users = await queryGetUsersByTenant(session)
  const canEdit = can(session.role, "user:update-role")

  const orgUsers = users.map((u) => ({
    id: u.id,
    authUserId: u.authUserId,
    name: u.name,
    email: u.email,
    jobTitle: u.jobTitle,
    managerId: u.managerId,
    // Encode custom role name inline so OrgChart can display it
    role: u.tenantRole ? `custom:${u.tenantRole.name}` : u.role,
    isActive: u.isActive,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/users"
            className="text-slate-400 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Network className="w-5 h-5 text-slate-400" />
              Organigramme
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {users.length} membre{users.length !== 1 ? "s" : ""}
              {canEdit && (
                <span className="ml-2 text-xs text-blue-600">
                  — Cliquez sur le crayon pour modifier poste et manager
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl min-h-64">
        <OrgChart users={orgUsers} canEdit={canEdit} />
      </div>
    </div>
  )
}
