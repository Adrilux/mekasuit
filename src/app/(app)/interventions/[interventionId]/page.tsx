import Link from "next/link"
import { notFound } from "next/navigation"
import { Pencil, RefreshCw, Printer } from "lucide-react"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertSiteAccess } from "@/lib/permissions/permission-checker-server"
import { queryGetInterventionDetail } from "@/server/queries/interventions/query-get-intervention-detail"
import { queryGetStockItemsBySite } from "@/server/queries/stock/query-get-stock-items-by-site"
import { buildUserNameMap } from "@/server/queries/users/query-get-users-by-auth-ids"
import { isModuleActive } from "@/lib/modules/module-access-checker"
import { ModuleName } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { InterventionStatusBadge } from "@/components/interventions/intervention-status-badge"
import { InterventionPriorityBadge } from "@/components/interventions/intervention-priority-badge"
import { InterventionStatusActions } from "@/components/interventions/intervention-status-actions"
import { InterventionNoteForm } from "@/components/interventions/intervention-note-form"
import { InterventionPartsPanel } from "@/components/interventions/intervention-parts-panel"
import { InterventionPlannedMaterialsPanel } from "@/components/interventions/intervention-planned-materials-panel"
import { queryGetRecurrenceChain } from "@/server/queries/interventions/query-get-recurrence-chain"
import { can } from "@/lib/permissions/permission-matrix"

const TYPE_LABELS: Record<string, string> = {
  CORRECTIVE: "Corrective (panne)",
  PREVENTIVE: "Préventive (planifiée)",
  PREDICTIVE: "Prédictive",
  INSPECTION: "Inspection / contrôle",
}

const RECURRENCE_LABELS: Record<string, string> = {
  WEEKLY: "Hebdomadaire (7 j)",
  BIWEEKLY: "Bimensuelle (14 j)",
  MONTHLY: "Mensuelle (30 j)",
  QUARTERLY: "Trimestrielle (90 j)",
  SEMIANNUAL: "Semestrielle (180 j)",
  ANNUAL: "Annuelle (365 j)",
  CUSTOM: "Personnalisée",
}

export default async function InterventionDetailPage({
  params,
}: {
  params: Promise<{ interventionId: string }>
}) {
  const { interventionId } = await params
  const session = await requireSession()
  const intervention = await queryGetInterventionDetail(session, interventionId)

  if (!intervention) notFound()

  assertSiteAccess(session.role, session.siteIds, intervention.siteId)

  const isTerminal = ["CLOSED", "CANCELLED"].includes(intervention.status)
  const canEdit = can(session.role, "intervention:update") && !isTerminal

  // Charge le stock si le module est actif
  // - Toujours chargé pour afficher les noms dans les panels (même après clôture)
  // - Utilisé pour l'ajout uniquement si !isTerminal
  const stockModuleActive = await isModuleActive(session.tenantId, ModuleName.STOCK_MANAGEMENT)
  const stockItems = stockModuleActive
    ? await queryGetStockItemsBySite(session, intervention.siteId)
    : []

  // Résolution du nom du technicien assigné (Better Auth user table)
  const authUserIds = [
    intervention.assignedUserId,
    ...intervention.notes.map((n) => n.authorUserId),
  ].filter((id): id is string => !!id)
  const userNameMap = await buildUserNameMap([...new Set(authUserIds)])

  // Chaîne de récurrence (pour les préventives récurrentes)
  const recurrenceChain = intervention.type === "PREVENTIVE" && intervention.recurrenceType
    ? await queryGetRecurrenceChain(session, interventionId)
    : []

  return (
    <div className="max-w-3xl space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900">{intervention.title}</h1>
            <InterventionPriorityBadge priority={intervention.priority} />
            <InterventionStatusBadge status={intervention.status} />
          </div>
          <p className="text-sm text-slate-500">
            {intervention.site.name}
            {intervention.machine && (
              <>
                {" · "}
                <Link href={`/machines/${intervention.machine.id}`} className="hover:text-blue-600">
                  {intervention.machine.name}
                </Link>
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <Button asChild variant="outline" size="sm">
            <Link href={`/interventions/${intervention.id}/print`} target="_blank">
              <Printer className="w-4 h-4 mr-1" />
              Bon de travail
            </Link>
          </Button>
          {canEdit && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/interventions/${intervention.id}/edit`}>
                <Pencil className="w-4 h-4 mr-1" />
                Modifier
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Actions de statut */}
      {!isTerminal && (
        <InterventionStatusActions
          interventionId={intervention.id}
          currentStatus={intervention.status}
          userRole={session.role}
        />
      )}

      {/* Détails */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">Détails</h2>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <dt className="text-slate-500">Type</dt>
            <dd className="font-medium">{TYPE_LABELS[intervention.type] ?? intervention.type}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Créée le</dt>
            <dd className="font-medium">{new Date(intervention.createdAt).toLocaleDateString("fr-FR")}</dd>
          </div>
          {intervention.assignedUserId && (
            <div>
              <dt className="text-slate-500">Technicien assigné</dt>
              <dd className="font-medium">
                {userNameMap.get(intervention.assignedUserId) ?? "Utilisateur inconnu"}
              </dd>
            </div>
          )}
          {intervention.scheduledAt && (
            <div>
              <dt className="text-slate-500">Planifiée le</dt>
              <dd className="font-medium">{new Date(intervention.scheduledAt).toLocaleDateString("fr-FR")}</dd>
            </div>
          )}
          {intervention.startedAt && (
            <div>
              <dt className="text-slate-500">Démarrée le</dt>
              <dd className="font-medium">{new Date(intervention.startedAt).toLocaleDateString("fr-FR")}</dd>
            </div>
          )}
          {intervention.closedAt && (
            <div>
              <dt className="text-slate-500">Clôturée le</dt>
              <dd className="font-medium">{new Date(intervention.closedAt).toLocaleDateString("fr-FR")}</dd>
            </div>
          )}
          {intervention.recurrenceType && (
            <div>
              <dt className="text-slate-500">Récurrence</dt>
              <dd className="font-medium flex items-center gap-1">
                <RefreshCw className="w-3 h-3 text-blue-500" />
                {RECURRENCE_LABELS[intervention.recurrenceType] ?? intervention.recurrenceType}
                {intervention.recurrenceType === "CUSTOM" && intervention.recurrenceIntervalDays && (
                  <span className="text-slate-500 font-normal">— {intervention.recurrenceIntervalDays} jours</span>
                )}
              </dd>
            </div>
          )}
          {intervention.parentInterventionId && (
            <div>
              <dt className="text-slate-500">Intervention précédente</dt>
              <dd className="font-medium">
                <Link href={`/interventions/${intervention.parentInterventionId}`} className="text-blue-600 hover:underline text-sm">
                  Voir l'occurrence précédente
                </Link>
              </dd>
            </div>
          )}
          {intervention.actualDurationMinutes && (
            <div>
              <dt className="text-slate-500">Durée réelle</dt>
              <dd className="font-medium">
                {intervention.actualDurationMinutes >= 60
                  ? `${Math.floor(intervention.actualDurationMinutes / 60)} h ${intervention.actualDurationMinutes % 60} min`
                  : `${intervention.actualDurationMinutes} min`}
              </dd>
            </div>
          )}
        </dl>

        {intervention.description && (
          <div>
            <p className="text-sm text-slate-500 mb-1">Description</p>
            <p className="text-sm text-slate-800 whitespace-pre-wrap">{intervention.description}</p>
          </div>
        )}
        {intervention.closingDiagnosis && (
          <div>
            <p className="text-sm font-medium text-slate-700 mb-1">Diagnostic de clôture</p>
            <p className="text-sm text-slate-800 whitespace-pre-wrap bg-slate-50 rounded p-3 border border-slate-100">{intervention.closingDiagnosis}</p>
          </div>
        )}
      </div>

      {/* Matériaux prévus — uniquement pour les préventives, si module stock actif */}
      {stockModuleActive && intervention.type === "PREVENTIVE" && (
        <InterventionPlannedMaterialsPanel
          interventionId={intervention.id}
          plannedMaterials={intervention.plannedMaterials.map((m) => ({
            id: m.id,
            stockItemId: m.stockItemId,
            quantityPlanned: m.quantityPlanned,
            note: m.note,
            stockItem: {
              id: m.stockItem.id,
              name: m.stockItem.name,
              reference: m.stockItem.reference,
              unit: m.stockItem.unit,
              quantityOnHand: m.stockItem.quantityOnHand,
            },
          }))}
          partsUsed={intervention.partsUsed.map((p) => ({
            id: p.id,
            stockItemId: p.stockItem.id,
            quantity: p.quantity,
          }))}
          stockItems={stockItems}
          isReadOnly={isTerminal}
        />
      )}

      {/* Pièces hors prévision — pour les correctives, ou hors-liste sur préventives */}
      {stockModuleActive && (
        <InterventionPartsPanel
          interventionId={intervention.id}
          partsUsed={intervention.partsUsed.map((p) => ({
            id: p.id,
            quantity: p.quantity,
            stockItem: {
              id: p.stockItem.id,
              name: p.stockItem.name,
              reference: p.stockItem.reference,
              unit: p.stockItem.unit,
            },
          }))}
          stockItems={stockItems}
          isReadOnly={isTerminal}
          isPreventive={intervention.type === "PREVENTIVE"}
        />
      )}

      {/* Notes / journal */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <h2 className="text-sm font-semibold text-slate-700 px-5 py-4 border-b border-slate-200">
          Journal ({intervention.notes.length})
        </h2>

        {intervention.notes.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-400 text-center">Aucune note</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {intervention.notes.map((note) => (
              <li key={note.id} className="px-5 py-4">
                <p className="text-sm text-slate-800 whitespace-pre-wrap">{note.content}</p>
                <p className="text-xs text-slate-400 mt-1">
                  <span className="font-medium text-slate-500">
                    {userNameMap.get(note.authorUserId) ?? "Inconnu"}
                  </span>
                  {" · "}
                  {new Date(note.createdAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </li>
            ))}
          </ul>
        )}

        {!isTerminal && (
          <div className="px-5 py-4 border-t border-slate-100">
            <InterventionNoteForm interventionId={intervention.id} />
          </div>
        )}
      </div>

      {/* Chaîne de récurrence */}
      {recurrenceChain.length > 1 && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-semibold text-slate-700">
              Chaîne de récurrence ({recurrenceChain.length} occurrences)
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {recurrenceChain.map((item, idx) => (
              <div
                key={item.id}
                className={`flex items-center justify-between px-5 py-3 text-sm ${item.id === interventionId ? "bg-blue-50" : "hover:bg-slate-50"}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 font-mono w-5 shrink-0">{idx + 1}</span>
                  {item.id === interventionId ? (
                    <span className="font-semibold text-blue-700">{item.title} <span className="text-xs font-normal text-blue-500">(actuel)</span></span>
                  ) : (
                    <Link href={`/interventions/${item.id}`} className="hover:text-blue-600 text-slate-800">
                      {item.title}
                    </Link>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0 text-xs text-slate-500">
                  {item.scheduledAt && (
                    <span>{new Date(item.scheduledAt).toLocaleDateString("fr-FR")}</span>
                  )}
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                    item.status === "CLOSED" ? "bg-green-50 text-green-700" :
                    item.status === "CANCELLED" ? "bg-slate-100 text-slate-500" :
                    "bg-blue-50 text-blue-700"
                  }`}>{item.status === "CLOSED" ? "Fermé" : item.status === "CANCELLED" ? "Annulé" : "Ouvert"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
