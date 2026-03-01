import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { isModuleActive } from "@/lib/modules/module-access-checker"
import { queryGetCustomReportById } from "@/server/queries/reports/query-get-custom-reports"
import { queryGetSitesByTenant } from "@/server/queries/sites/query-get-sites-by-tenant"
import { CustomReportBuilder } from "@/components/reports/custom-report-builder"
import { ModuleName } from "@prisma/client"

export default async function CustomReportEditPage({
  params,
}: {
  params: Promise<{ reportId: string }>
}) {
  const { reportId } = await params
  const session = await requireSession()
  assertCan(session.role, "report:read")

  const moduleActive = await isModuleActive(session.tenantId, ModuleName.ADVANCED_REPORTS)
  if (!moduleActive) notFound()

  const [report, sites] = await Promise.all([
    queryGetCustomReportById(session, reportId),
    queryGetSitesByTenant(session),
  ])

  if (!report) notFound()

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/reports/custom/${reportId}`} className="text-slate-500 hover:text-slate-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-slate-900">Modifier : {report.name}</h1>
      </div>

      <CustomReportBuilder
        sites={sites.map((s) => ({ id: s.id, name: s.name }))}
        initialName={report.name}
        initialColumns={report.columns}
        initialFilters={report.filters}
        reportId={reportId}
      />
    </div>
  )
}
