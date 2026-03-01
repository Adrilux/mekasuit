import Link from "next/link"
import { ClipboardList, Plus, CheckCircle, Clock } from "lucide-react"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertModuleActive } from "@/lib/modules/module-access-checker"
import { ModuleName } from "@prisma/client"
import { queryGetSitesByTenant } from "@/server/queries/sites/query-get-sites-by-tenant"
import { queryGetInventorySessions } from "@/server/queries/stock/query-get-inventory-sessions"
import { Button } from "@/components/ui/button"
import { can } from "@/lib/permissions/permission-matrix"

export default async function InventoryListPage({
  searchParams,
}: {
  searchParams: Promise<{ siteId?: string }>
}) {
  const { siteId: siteIdParam } = await searchParams
  const session = await requireSession()
  await assertModuleActive(session.tenantId, ModuleName.STOCK_MANAGEMENT)

  const sites = await queryGetSitesByTenant(session)
  const activeSite = (siteIdParam ? sites.find((s) => s.id === siteIdParam) : null)
    ?? sites.find((s) => s.isActive)
    ?? sites[0]

  const sessions = activeSite ? await queryGetInventorySessions(session, activeSite.id) : []
  const canCreate = can(session.role, "stock:movement")

  const openSession = sessions.find((s) => s.status === "OPEN")

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-slate-500" />
          <h1 className="text-xl font-bold text-slate-900">Inventaires physiques</h1>
        </div>
        {canCreate && activeSite && (
          openSession ? (
            <Button asChild size="sm">
              <Link href={`/stock/inventory/${openSession.id}`}>
                Reprendre la session en cours
              </Link>
            </Button>
          ) : (
            <form action={`/stock/inventory/new?siteId=${activeSite.id}`}>
              <Button asChild size="sm">
                <Link href={`/stock/inventory/new?siteId=${activeSite.id}`}>
                  <Plus className="w-4 h-4 mr-1" />
                  Ouvrir une session
                </Link>
              </Button>
            </form>
          )
        )}
      </div>

      {openSession && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-3">
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            Une session est en cours — {openSession.countedCount}/{openSession.itemCount} articles comptés.{" "}
            <Link href={`/stock/inventory/${openSession.id}`} className="font-medium underline">
              Continuer
            </Link>
          </p>
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg px-6 py-12 text-center">
          <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Aucun inventaire réalisé sur ce site</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-medium text-slate-600">Date</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Statut</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Progression</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-700">
                    {new Date(s.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    {s.status === "OPEN" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" />
                        En cours
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        Clôturé
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {s.countedCount}/{s.itemCount} articles
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/stock/inventory/${s.id}`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Voir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
