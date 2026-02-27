import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ArrowLeftRight, CheckCircle, XCircle } from "lucide-react"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { assertModuleActive } from "@/lib/modules/module-access-checker"
import { ModuleName } from "@prisma/client"
import { queryGetStockTransferById } from "@/server/queries/stock/query-get-stock-transfers"
import { buildUserNameMap } from "@/server/queries/users/query-get-users-by-auth-ids"
import { actionResolveStockTransfer } from "@/server/actions/stock/action-resolve-stock-transfer"
import { can } from "@/lib/permissions/permission-matrix"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

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

type Props = {
  params: Promise<{ requestId: string }>
}

export default async function StockTransferDetailPage({ params }: Props) {
  const { requestId } = await params
  const session = await requireSession()
  assertCan(session.role, "stock:transfer:create")
  await assertModuleActive(session.tenantId, ModuleName.INTER_SITE_TRANSFERS)

  const transfer = await queryGetStockTransferById(session, requestId)
  if (!transfer) notFound()

  const allIds = [transfer.requestedById, transfer.approvedById].filter(Boolean) as string[]
  const userNames = await buildUserNameMap([...new Set(allIds)])

  const canApprove = can(session.role, "stock:transfer:approve")
  const isPending = transfer.status === "PENDING"

  return (
    <div className="max-w-2xl space-y-6">
      {/* Retour */}
      <Link
        href="/stock/transfers"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux transferts
      </Link>

      {/* En-tête */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
            <ArrowLeftRight className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Transfert de stock
            </h1>
            <p className="text-sm text-slate-500 font-mono">#{transfer.id.slice(-8).toUpperCase()}</p>
          </div>
        </div>
        <Badge variant={STATUS_VARIANTS[transfer.status] ?? "outline"}>
          {STATUS_LABELS[transfer.status] ?? transfer.status}
        </Badge>
      </div>

      {/* Détails */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Détails du transfert</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
          <div>
            <dt className="text-slate-500">Article</dt>
            <dd className="font-medium text-slate-900 mt-0.5">
              <Link href={`/stock/${transfer.stockItem.id}`} className="hover:text-blue-600">
                {transfer.stockItem.name}
              </Link>
              <span className="ml-2 text-xs font-mono text-slate-400">{transfer.stockItem.reference}</span>
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Quantité</dt>
            <dd className="font-medium text-slate-900 mt-0.5">
              {transfer.quantity} {transfer.stockItem.unit}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Site source</dt>
            <dd className="font-medium text-slate-900 mt-0.5">{transfer.fromSite.name}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Site destination</dt>
            <dd className="font-medium text-slate-900 mt-0.5">{transfer.toSite.name}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Demandé par</dt>
            <dd className="font-medium text-slate-900 mt-0.5">
              {userNames.get(transfer.requestedById) ?? transfer.requestedById}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Date de demande</dt>
            <dd className="font-medium text-slate-900 mt-0.5">
              {new Date(transfer.createdAt).toLocaleDateString("fr-FR", {
                day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
              })}
            </dd>
          </div>
          {transfer.resolvedAt && (
            <div>
              <dt className="text-slate-500">Traité le</dt>
              <dd className="font-medium text-slate-900 mt-0.5">
                {new Date(transfer.resolvedAt).toLocaleDateString("fr-FR", {
                  day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
                })}
              </dd>
            </div>
          )}
          {transfer.approvedById && (
            <div>
              <dt className="text-slate-500">Traité par</dt>
              <dd className="font-medium text-slate-900 mt-0.5">
                {userNames.get(transfer.approvedById) ?? transfer.approvedById}
              </dd>
            </div>
          )}
          {transfer.reason && (
            <div className="sm:col-span-2">
              <dt className="text-slate-500">Motif</dt>
              <dd className="font-medium text-slate-900 mt-0.5 whitespace-pre-line">{transfer.reason}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Actions — uniquement si en attente + permission */}
      {isPending && canApprove && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-amber-800 mb-3">Action requise</h2>
          <p className="text-sm text-amber-700 mb-4">
            Cette demande est en attente d&apos;approbation. Approuver transférera immédiatement le stock.
          </p>
          <div className="flex items-center gap-3">
            <form
              action={async () => {
                "use server"
                await actionResolveStockTransfer({ transferId: requestId, action: "APPROVE" })
                redirect("/stock/transfers")
              }}
            >
              <Button type="submit" size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                <CheckCircle className="w-4 h-4 mr-1.5" />
                Approuver
              </Button>
            </form>
            <form
              action={async () => {
                "use server"
                await actionResolveStockTransfer({ transferId: requestId, action: "REJECT" })
                redirect("/stock/transfers")
              }}
            >
              <Button type="submit" size="sm" variant="destructive">
                <XCircle className="w-4 h-4 mr-1.5" />
                Refuser
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Résultat si traité */}
      {!isPending && (
        <div className={`rounded-lg p-4 text-sm font-medium ${
          transfer.status === "COMPLETED"
            ? "bg-green-50 border border-green-200 text-green-800"
            : transfer.status === "REJECTED"
            ? "bg-red-50 border border-red-200 text-red-800"
            : "bg-slate-50 border border-slate-200 text-slate-700"
        }`}>
          {transfer.status === "COMPLETED"
            ? `Transfert approuvé et exécuté — ${transfer.quantity} ${transfer.stockItem.unit} déplacé(s) vers ${transfer.toSite.name}.`
            : transfer.status === "REJECTED"
            ? "Cette demande de transfert a été refusée."
            : `Statut : ${STATUS_LABELS[transfer.status] ?? transfer.status}`}
        </div>
      )}
    </div>
  )
}
