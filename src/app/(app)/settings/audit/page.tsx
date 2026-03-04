import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { queryGetAuditLogs } from "@/server/queries/audit/query-get-audit-logs"
import { buildUserNameMap } from "@/server/queries/users/query-get-users-by-auth-ids"

const ACTION_LABELS: Record<string, string> = {
  "intervention.created": "Intervention créée",
  "intervention.status.open": "→ Ouvert",
  "intervention.status.in_progress": "→ En cours",
  "intervention.status.pending_parts": "→ Attente pièces",
  "intervention.status.closed": "→ Fermé",
  "intervention.status.cancelled": "→ Annulé",
  "machine.created": "Machine créée",
  "machine.archived": "Machine archivée",
  "stock.movement.in": "Entrée stock",
  "stock.movement.adjustment": "Ajustement stock",
  "stock.movement.out": "Sortie stock",
  "stock.movement.transfer_in": "Réception transfert",
  "stock.movement.transfer_out": "Expédition transfert",
}

const ENTITY_LABELS: Record<string, string> = {
  intervention: "Intervention",
  machine: "Machine",
  stock_item: "Stock",
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ entityType?: string }>
}) {
  const params = await searchParams
  const session = await requireSession()
  assertCan(session, "audit:read")

  const logs = await queryGetAuditLogs(session, {
    entityType: params.entityType,
    limit: 200,
  })

  const userIds = [...new Set(logs.map((l) => l.userId))]
  const userNames = await buildUserNameMap(userIds)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Journal d'audit</h1>
          <p className="text-sm text-slate-500 mt-1">Historique des actions réalisées dans votre espace</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { value: "", label: "Tout" },
          { value: "intervention", label: "Interventions" },
          { value: "machine", label: "Machines" },
          { value: "stock_item", label: "Stock" },
        ].map((f) => (
          <a
            key={f.value}
            href={f.value ? `?entityType=${f.value}` : "?"}
            className={`h-7 px-3 text-xs rounded-full border transition-colors ${
              (params.entityType ?? "") === f.value
                ? "bg-blue-600 border-blue-600 text-white"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>

      {logs.length === 0 ? (
        <p className="text-sm text-slate-400 py-8 text-center">Aucune entrée dans le journal.</p>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-medium text-slate-600">Date</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Utilisateur</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Action</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Entité</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Objet</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2.5 text-slate-500 text-xs whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-slate-800">
                    {userNames.get(log.userId) ?? log.userId.slice(0, 8) + "…"}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="inline-block px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 font-mono">
                      {ACTION_LABELS[log.action] ?? log.action}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 text-xs">
                    {ENTITY_LABELS[log.entityType] ?? log.entityType}
                  </td>
                  <td className="px-4 py-2.5 text-slate-700 max-w-xs truncate">{log.entityLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  )
}
