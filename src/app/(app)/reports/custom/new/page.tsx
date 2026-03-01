import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { isModuleActive } from "@/lib/modules/module-access-checker"
import { queryGetSitesByTenant } from "@/server/queries/sites/query-get-sites-by-tenant"
import { CustomReportBuilder } from "@/components/reports/custom-report-builder"
import { ModuleName } from "@prisma/client"

export default async function CustomReportNewPage() {
  const session = await requireSession()
  assertCan(session.role, "report:read")

  const moduleActive = await isModuleActive(session.tenantId, ModuleName.ADVANCED_REPORTS)
  if (!moduleActive) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Module Rapports Avancés non activé.</p>
      </div>
    )
  }

  const sites = await queryGetSitesByTenant(session)

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/reports/custom" className="text-slate-500 hover:text-slate-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-slate-900">Nouveau rapport personnalisé</h1>
      </div>

      <CustomReportBuilder
        sites={sites.map((s) => ({ id: s.id, name: s.name }))}
      />
    </div>
  )
}
