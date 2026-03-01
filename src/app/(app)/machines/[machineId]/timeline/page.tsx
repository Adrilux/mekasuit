import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Wrench, ClipboardCheck, XCircle, Settings } from "lucide-react"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertSiteAccess } from "@/lib/permissions/permission-checker-server"
import { queryGetMachineDetail } from "@/server/queries/machines/query-get-machine-detail"
import { queryGetMachineTimeline } from "@/server/queries/machines/query-get-machine-timeline"
import { buildUserNameMap } from "@/server/queries/users/query-get-users-by-auth-ids"

const INTERVENTION_TYPE_LABELS: Record<string, string> = {
  CORRECTIVE: "Corrective",
  PREVENTIVE: "Préventive",
  PREDICTIVE: "Prédictive",
  INSPECTION: "Inspection",
}

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Basse",
  MEDIUM: "Moyenne",
  HIGH: "Haute",
  CRITICAL: "Critique",
}

const AUDIT_ACTION_LABELS: Record<string, string> = {
  "machine.created": "Machine créée",
  "machine.status_changed": "Statut modifié",
  "machine.restored": "Machine restaurée",
  "machine.archived": "Machine archivée",
}

export default async function MachineTimelinePage({
  params,
}: {
  params: Promise<{ machineId: string }>
}) {
  const { machineId } = await params
  const session = await requireSession()

  const machine = await queryGetMachineDetail(session, machineId)
  if (!machine) notFound()
  assertSiteAccess(session.role, session.siteIds, machine.siteId)

  const events = await queryGetMachineTimeline(session, machineId)

  // Résoudre les noms des utilisateurs pour les événements audit
  const auditUserIds = events
    .filter((e) => e.kind === "audit")
    .map((e) => (e.kind === "audit" ? e.userId : ""))
    .filter(Boolean)
  const userNameMap = await buildUserNameMap([...new Set(auditUserIds)])

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/machines/${machineId}`}
          className="text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Timeline — {machine.name}</h1>
          <p className="text-sm text-slate-500">{machine.site.name}</p>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-10 text-center text-sm text-slate-400">
          Aucun événement enregistré pour cette machine.
        </div>
      ) : (
        <div className="relative">
          {/* Ligne verticale */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200" />

          <ol className="space-y-0">
            {events.map((event, idx) => {
              const isLast = idx === events.length - 1
              return (
                <li key={event.id} className={`relative flex gap-4 ${isLast ? "" : "pb-6"}`}>
                  {/* Dot */}
                  <div className="relative z-10 flex-shrink-0">
                    <EventDot event={event} />
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <EventContent event={event} userNameMap={userNameMap} />
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(event.date).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      )}
    </div>
  )
}

import type { TimelineEvent } from "@/server/queries/machines/query-get-machine-timeline"

function EventDot({ event }: { event: TimelineEvent }) {
  if (event.kind === "intervention_created") {
    return (
      <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center">
        <Wrench className="w-4 h-4 text-blue-500" />
      </div>
    )
  }
  if (event.kind === "intervention_closed") {
    return (
      <div className="w-10 h-10 rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
        <ClipboardCheck className="w-4 h-4 text-green-500" />
      </div>
    )
  }
  if (event.kind === "intervention_cancelled") {
    return (
      <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
        <XCircle className="w-4 h-4 text-slate-400" />
      </div>
    )
  }
  // audit
  return (
    <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
      <Settings className="w-4 h-4 text-amber-500" />
    </div>
  )
}

function EventContent({
  event,
  userNameMap,
}: {
  event: TimelineEvent
  userNameMap: Map<string, string>
}) {
  if (event.kind === "intervention_created") {
    return (
      <div>
        <p className="text-sm font-medium text-slate-800">
          Intervention créée —{" "}
          <Link href={`/interventions/${event.interventionId}`} className="text-blue-600 hover:underline">
            {event.title}
          </Link>
        </p>
        <p className="text-xs text-slate-500">
          {INTERVENTION_TYPE_LABELS[event.type] ?? event.type} · Priorité{" "}
          {PRIORITY_LABELS[event.priority] ?? event.priority}
        </p>
      </div>
    )
  }

  if (event.kind === "intervention_closed") {
    return (
      <div>
        <p className="text-sm font-medium text-slate-800">
          Intervention clôturée —{" "}
          <Link href={`/interventions/${event.interventionId}`} className="text-blue-600 hover:underline">
            {event.title}
          </Link>
        </p>
        <p className="text-xs text-slate-500">{INTERVENTION_TYPE_LABELS[event.type] ?? event.type}</p>
      </div>
    )
  }

  if (event.kind === "intervention_cancelled") {
    return (
      <div>
        <p className="text-sm font-medium text-slate-500">
          Intervention annulée —{" "}
          <Link href={`/interventions/${event.interventionId}`} className="text-blue-600 hover:underline">
            {event.title}
          </Link>
        </p>
      </div>
    )
  }

  // audit
  const label = AUDIT_ACTION_LABELS[event.action] ?? event.action
  const actor = userNameMap.get(event.userId) ?? "Utilisateur inconnu"
  const changes = event.changes

  return (
    <div>
      <p className="text-sm font-medium text-slate-800">{label}</p>
      <p className="text-xs text-slate-500">par {actor}</p>
      {changes && event.action === "machine.status_changed" && (
        <p className="text-xs text-slate-400 mt-0.5">
          {statusLabel(String(changes.from))} → {statusLabel(String(changes.to))}
        </p>
      )}
    </div>
  )
}

function statusLabel(s: string) {
  const m: Record<string, string> = {
    OPERATIONAL: "Opérationnelle",
    UNDER_MAINTENANCE: "En maintenance",
    DECOMMISSIONED: "Hors service",
  }
  return m[s] ?? s
}
