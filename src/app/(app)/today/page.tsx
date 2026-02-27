import Link from "next/link"
import { CalendarCheck, CheckCircle } from "lucide-react"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { queryGetMyInterventionsToday } from "@/server/queries/interventions/query-get-my-interventions-today"
import { InterventionStatusBadge } from "@/components/interventions/intervention-status-badge"
import { InterventionPriorityBadge } from "@/components/interventions/intervention-priority-badge"
import { EmptyStatePlaceholder } from "@/components/feedback/empty-state-placeholder"

const TYPE_LABELS: Record<string, string> = {
  CORRECTIVE: "Corrective",
  PREVENTIVE: "Préventive",
  IMPROVEMENT: "Amélioration",
}

function isOverdue(scheduledAt: Date | null): boolean {
  if (!scheduledAt) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return scheduledAt < today
}

export default async function TodayPage() {
  const session = await requireSession()
  const interventions = await queryGetMyInterventionsToday(session)

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  const overdue = interventions.filter((i) => isOverdue(i.scheduledAt))
  const todayItems = interventions.filter((i) => !isOverdue(i.scheduledAt))

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <CalendarCheck className="w-5 h-5 text-blue-600" />
        <h1 className="text-xl font-bold text-slate-900">Mes interventions</h1>
      </div>
      <p className="text-sm text-slate-500 mb-6 capitalize">{today}</p>

      {interventions.length === 0 ? (
        <EmptyStatePlaceholder
          icon={CheckCircle}
          title="Aucune intervention aujourd'hui"
          description="Vous n'avez pas d'intervention planifiée ou en cours pour aujourd'hui."
        />
      ) : (
        <div className="space-y-6">
          {overdue.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-red-600 mb-3 flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
                En retard ({overdue.length})
              </h2>
              <div className="space-y-2">
                {overdue.map((i) => (
                  <InterventionCard key={i.id} intervention={i} overdue />
                ))}
              </div>
            </section>
          )}

          {todayItems.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
                Aujourd'hui ({todayItems.length})
              </h2>
              <div className="space-y-2">
                {todayItems.map((i) => (
                  <InterventionCard key={i.id} intervention={i} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

type CardProps = {
  intervention: {
    id: string
    title: string
    type: string
    priority: string
    status: string
    scheduledAt: Date | null
    machine: { id: string; name: string } | null
    site: { name: string }
  }
  overdue?: boolean
}

function InterventionCard({ intervention: i, overdue }: CardProps) {
  return (
    <Link
      href={`/interventions/${i.id}`}
      className={`block bg-white rounded-lg border p-4 hover:shadow-sm transition-shadow ${
        overdue ? "border-red-200 bg-red-50/30" : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 truncate">{i.title}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {i.site.name}
            {i.machine && ` — ${i.machine.name}`}
          </p>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <InterventionPriorityBadge priority={i.priority as never} />
          <InterventionStatusBadge status={i.status as never} />
        </div>
      </div>
      <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
        <span>{TYPE_LABELS[i.type] ?? i.type}</span>
        {i.scheduledAt && (
          <>
            <span>·</span>
            <span className={overdue ? "text-red-500 font-medium" : ""}>
              {overdue ? "Planifié le " : ""}
              {new Date(i.scheduledAt).toLocaleDateString("fr-FR")}
            </span>
          </>
        )}
      </div>
    </Link>
  )
}
