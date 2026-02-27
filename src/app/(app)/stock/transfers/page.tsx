import Link from "next/link"
import { Plus, ArrowLeftRight } from "lucide-react"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { assertModuleActive } from "@/lib/modules/module-access-checker"
import { ModuleName } from "@prisma/client"
import { queryGetStockTransfers } from "@/server/queries/stock/query-get-stock-transfers"
import { buildUserNameMap } from "@/server/queries/users/query-get-users-by-auth-ids"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmptyStatePlaceholder } from "@/components/feedback/empty-state-placeholder"
import { can } from "@/lib/permissions/permission-matrix"

const STATUS_LABELS: Record<string, string> = {
  PENDING:   "En attente",
  APPROVED:  "Approuvé",
  REJECTED:  "Refusé",
  COMPLETED: "Complété",
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING:   "secondary",
  APPROVED:  "default",
  REJECTED:  "destructive",
  COMPLETED: "outline",
}

export default async function StockTransfersPage() {
  const session = await requireSession()
  assertCan(session.role, "stock:transfer:create")
  await assertModuleActive(session.tenantId, ModuleName.INTER_SITE_TRANSFERS)

  const transfers = await queryGetStockTransfers(session)

  const allUserIds = [...new Set(transfers.flatMap((t) => [t.requestedById, t.approvedById].filter(Boolean) as string[]))]
  const userNames = await buildUserNameMap(allUserIds)

  const canApprove = can(session.role, "stock:transfer:approve")
  const canCreate  = can(session.role, "stock:transfer:create")

  const pending   = transfers.filter((t) => t.status === "PENDING")
  const resolved  = transfers.filter((t) => t.status !== "PENDING")

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Transferts de stock</h1>
          <p className="text-sm text-slate-500 mt-0.5">Demandes de transfert entre sites</p>
        </div>
        {canCreate && (
          <Button asChild size="sm" className="self-start sm:self-auto">
            <Link href="/stock/transfers/new">
              <Plus className="w-4 h-4 mr-1" />
              Nouveau transfert
            </Link>
          </Button>
        )}
      </div>

      {transfers.length === 0 ? (
        <EmptyStatePlaceholder
          icon={ArrowLeftRight}
          title="Aucun transfert"
          description="Les demandes de transfert de stock entre sites apparaîtront ici."
          action={
            canCreate ? (
              <Button asChild size="sm">
                <Link href="/stock/transfers/new">Créer un transfert</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-6">
          {/* En attente */}
          {pending.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-amber-700 uppercase tracking-wide mb-3">
                En attente d'approbation ({pending.length})
              </h2>
              <div className="bg-white border border-amber-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <TransferTable transfers={pending} userNames={userNames} canApprove={canApprove} />
                </div>
              </div>
            </section>
          )}

          {/* Historique */}
          {resolved.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Historique
              </h2>
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <TransferTable transfers={resolved} userNames={userNames} canApprove={false} />
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function TransferTable({
  transfers,
  userNames,
  canApprove,
}: {
  transfers: Awaited<ReturnType<typeof queryGetStockTransfers>>
  userNames: Map<string, string>
  canApprove: boolean
}) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-slate-50 border-b border-slate-200">
          <th className="text-left px-4 py-3 font-medium text-slate-600">Article</th>
          <th className="text-left px-4 py-3 font-medium text-slate-600">De → Vers</th>
          <th className="text-left px-4 py-3 font-medium text-slate-600">Qté</th>
          <th className="text-left px-4 py-3 font-medium text-slate-600">Demandé par</th>
          <th className="text-left px-4 py-3 font-medium text-slate-600">Date</th>
          <th className="text-left px-4 py-3 font-medium text-slate-600">Statut</th>
          {canApprove && <th className="px-4 py-3" />}
        </tr>
      </thead>
      <tbody>
        {transfers.map((t) => (
          <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
            <td className="px-4 py-3 font-medium text-slate-900">{t.stockItem.name}</td>
            <td className="px-4 py-3 text-slate-600">
              {t.fromSite.name} <ArrowLeftRight className="w-3 h-3 inline mx-1 text-slate-400" /> {t.toSite.name}
            </td>
            <td className="px-4 py-3">{t.quantity} {t.stockItem.unit}</td>
            <td className="px-4 py-3 text-slate-500">{userNames.get(t.requestedById) ?? "—"}</td>
            <td className="px-4 py-3 text-slate-500">
              {new Date(t.createdAt).toLocaleDateString("fr-FR")}
            </td>
            <td className="px-4 py-3">
              <Badge variant={STATUS_VARIANTS[t.status]}>
                {STATUS_LABELS[t.status] ?? t.status}
              </Badge>
            </td>
            {canApprove && (
              <td className="px-4 py-3">
                <Link href={`/stock/transfers/${t.id}`} className="text-xs text-blue-600 hover:underline">
                  Voir
                </Link>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
