import Link from "next/link"
import { Plus, FileBarChart2, Trash2 } from "lucide-react"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { isModuleActive } from "@/lib/modules/module-access-checker"
import { queryGetCustomReports } from "@/server/queries/reports/query-get-custom-reports"
import { Button } from "@/components/ui/button"
import { ModuleName } from "@prisma/client"
import { CustomReportDeleteButton } from "@/components/reports/custom-report-delete-button"

export default async function CustomReportsPage() {
  const session = await requireSession()
  assertCan(session, "report:read")

  const moduleActive = await isModuleActive(session.tenantId, ModuleName.ADVANCED_REPORTS)
  if (!moduleActive) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Module Rapports Avancés non activé.</p>
      </div>
    )
  }

  const reports = await queryGetCustomReports(session)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-900">Rapports personnalisés</h1>
        <Button asChild size="sm">
          <Link href="/reports/custom/new">
            <Plus className="w-4 h-4 mr-1.5" />
            Nouveau rapport
          </Link>
        </Button>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-lg">
          <FileBarChart2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Aucun rapport personnalisé</p>
          <p className="text-sm text-slate-400 mt-1">
            Créez votre premier rapport en sélectionnant les colonnes et filtres.
          </p>
          <Button asChild size="sm" className="mt-4">
            <Link href="/reports/custom/new">
              <Plus className="w-4 h-4 mr-1.5" />
              Créer un rapport
            </Link>
          </Button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
          {reports.map((report) => (
            <div key={report.id} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50">
              <div>
                <Link
                  href={`/reports/custom/${report.id}`}
                  className="font-medium text-slate-900 hover:underline"
                >
                  {report.name}
                </Link>
                <div className="text-xs text-slate-500 mt-0.5">
                  {report.columns.length} colonne{report.columns.length > 1 ? "s" : ""}
                  {" · "}
                  Modifié le {report.updatedAt.toLocaleDateString("fr-FR")}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/reports/custom/${report.id}`}>Ouvrir</Link>
                </Button>
                <CustomReportDeleteButton reportId={report.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
