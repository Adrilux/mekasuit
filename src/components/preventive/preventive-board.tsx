"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  AlertTriangle, Clock, CalendarCheck, CalendarClock,
  User, ChevronDown, Loader2, RefreshCw, Wrench
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { InterventionStatusBadge } from "@/components/interventions/intervention-status-badge"
import { actionAssignIntervention } from "@/server/actions/interventions/action-assign-intervention"
import type { PreventiveItem } from "@/server/queries/interventions/query-get-preventives"

type Technician = { id: string; name: string }

type Props = {
  interventions: PreventiveItem[]
  userNameMap: Map<string, string>
  technicians: Technician[]
  sessionRole: string
  canAssign: boolean
}

// Calcule la catégorie temporelle d'une préventive
function getTemporalCategory(scheduledAt: Date | null): "overdue" | "thisweek" | "thismonth" | "later" | "unscheduled" {
  if (!scheduledAt) return "unscheduled"
  const now = new Date()
  const diff = (scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  if (diff < 0) return "overdue"
  if (diff <= 7) return "thisweek"
  if (diff <= 30) return "thismonth"
  return "later"
}

const CATEGORIES = [
  {
    key: "overdue",
    label: "En retard",
    icon: AlertTriangle,
    iconClass: "text-red-500",
    bg: "bg-red-50 border-red-200",
    headerBg: "bg-red-100 border-red-200",
    headerText: "text-red-800",
    badgeBg: "bg-red-500",
  },
  {
    key: "thisweek",
    label: "Cette semaine",
    icon: Clock,
    iconClass: "text-amber-500",
    bg: "bg-amber-50 border-amber-200",
    headerBg: "bg-amber-100 border-amber-200",
    headerText: "text-amber-800",
    badgeBg: "bg-amber-500",
  },
  {
    key: "thismonth",
    label: "Ce mois-ci",
    icon: CalendarCheck,
    iconClass: "text-blue-500",
    bg: "bg-blue-50 border-blue-200",
    headerBg: "bg-blue-100 border-blue-200",
    headerText: "text-blue-800",
    badgeBg: "bg-blue-500",
  },
  {
    key: "later",
    label: "Planifié plus tard",
    icon: CalendarClock,
    iconClass: "text-slate-400",
    bg: "bg-slate-50 border-slate-200",
    headerBg: "bg-slate-100 border-slate-200",
    headerText: "text-slate-600",
    badgeBg: "bg-slate-400",
  },
  {
    key: "unscheduled",
    label: "Non planifié",
    icon: CalendarClock,
    iconClass: "text-slate-300",
    bg: "bg-white border-slate-100",
    headerBg: "bg-slate-50 border-slate-100",
    headerText: "text-slate-500",
    badgeBg: "bg-slate-300",
  },
] as const

const PRIORITY_LABELS: Record<string, string> = {
  CRITICAL: "Critique",
  HIGH: "Haute",
  MEDIUM: "Normale",
  LOW: "Basse",
}
const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "text-red-600 bg-red-50",
  HIGH: "text-orange-600 bg-orange-50",
  MEDIUM: "text-blue-600 bg-blue-50",
  LOW: "text-slate-500 bg-slate-50",
}
const RECURRENCE_LABELS: Record<string, string> = {
  WEEKLY: "Hebdo",
  BIWEEKLY: "2 sem.",
  MONTHLY: "Mensuel",
  QUARTERLY: "Trimest.",
  SEMIANNUAL: "Semestriel",
  ANNUAL: "Annuel",
  CUSTOM: "Custom",
}

function formatDate(date: Date | null): string {
  if (!date) return "—"
  const d = new Date(date)
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
}

function AssignSelect({
  interventionId,
  assignedUserId,
  technicians,
  userNameMap,
}: {
  interventionId: string
  assignedUserId: string | null
  technicians: Technician[]
  userNameMap: Map<string, string>
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleChange(value: string) {
    setLoading(true)
    const result = await actionAssignIntervention({
      interventionId,
      assignedUserId: value === "_none" ? null : value,
    })
    setLoading(false)
    if (!result.success) { toast.error(result.error); return }
    router.refresh()
  }

  const currentName = assignedUserId ? (userNameMap.get(assignedUserId) ?? "Inconnu") : null

  return (
    <div className="flex items-center gap-1 mt-1.5">
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
      ) : (
        <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
      )}
      <Select
        value={assignedUserId ?? "_none"}
        onValueChange={(v) => { void handleChange(v) }}
        disabled={loading}
      >
        <SelectTrigger className="h-6 text-xs border-0 bg-transparent px-0 focus:ring-0 w-auto min-w-0">
          <SelectValue placeholder="Assigner..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_none" className="text-xs text-slate-400">Non assigné</SelectItem>
          {technicians.map((t) => (
            <SelectItem key={t.id} value={t.id} className="text-xs">{t.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function PreventiveCard({
  item,
  userNameMap,
  technicians,
  canAssign,
}: {
  item: PreventiveItem
  userNameMap: Map<string, string>
  technicians: Technician[]
  canAssign: boolean
}) {
  const assigneeName = item.assignedUserId ? (userNameMap.get(item.assignedUserId) ?? "—") : null

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3.5 hover:border-slate-300 hover:shadow-sm transition-all group">
      {/* Titre */}
      <Link
        href={`/interventions/${item.id}`}
        className="font-medium text-slate-900 text-sm hover:text-blue-600 block leading-tight"
      >
        {item.title}
      </Link>

      {/* Machine */}
      {item.machine && (
        <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
          <Wrench className="w-3 h-3" />
          {item.machine.name}
        </div>
      )}

      {/* Métadonnées */}
      <div className="flex items-center justify-between mt-2 flex-wrap gap-1">
        <div className="flex items-center gap-1.5">
          {/* Priorité */}
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${PRIORITY_COLORS[item.priority] ?? ""}`}>
            {PRIORITY_LABELS[item.priority] ?? item.priority}
          </span>
          {/* Récurrence */}
          {item.recurrenceType && (
            <span className="text-xs bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <RefreshCw className="w-2.5 h-2.5" />
              {RECURRENCE_LABELS[item.recurrenceType] ?? item.recurrenceType}
            </span>
          )}
        </div>
        {/* Statut */}
        <InterventionStatusBadge status={item.status as never} />
      </div>

      {/* Site */}
      <p className="text-xs text-slate-400 mt-1.5">{item.site.name}</p>

      {/* Date planifiée */}
      {item.scheduledAt && (
        <p className="text-xs text-slate-500 mt-0.5">
          Planifié : <span className="font-medium">{formatDate(item.scheduledAt)}</span>
        </p>
      )}

      {/* Assignation */}
      {canAssign ? (
        <AssignSelect
          interventionId={item.id}
          assignedUserId={item.assignedUserId}
          technicians={technicians}
          userNameMap={userNameMap}
        />
      ) : assigneeName ? (
        <div className="flex items-center gap-1 mt-1.5 text-xs text-slate-500">
          <User className="w-3.5 h-3.5" />
          {assigneeName}
        </div>
      ) : (
        <p className="text-xs text-slate-300 mt-1.5 italic">Non assigné</p>
      )}
    </div>
  )
}

function CategorySection({
  category,
  items,
  userNameMap,
  technicians,
  canAssign,
}: {
  category: (typeof CATEGORIES)[number]
  items: PreventiveItem[]
  userNameMap: Map<string, string>
  technicians: Technician[]
  canAssign: boolean
}) {
  const [collapsed, setCollapsed] = useState(false)
  const Icon = category.icon

  if (items.length === 0) return null

  return (
    <section className={`rounded-xl border overflow-hidden ${category.bg}`}>
      {/* Header section */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={`w-full flex items-center justify-between px-4 py-3 border-b ${category.headerBg} transition-colors`}
      >
        <div className="flex items-center gap-2.5">
          <Icon className={`w-4 h-4 ${category.iconClass}`} />
          <span className={`font-semibold text-sm ${category.headerText}`}>{category.label}</span>
          <span className={`text-xs text-white font-bold px-2 py-0.5 rounded-full ${category.badgeBg}`}>
            {items.length}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 ${category.headerText} transition-transform ${collapsed ? "-rotate-90" : ""}`} />
      </button>

      {!collapsed && (
        <div className="p-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {items.map((item) => (
            <PreventiveCard
              key={item.id}
              item={item}
              userNameMap={userNameMap}
              technicians={technicians}
              canAssign={canAssign}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export function PreventiveBoard({ interventions, userNameMap, technicians, sessionRole, canAssign }: Props) {
  // Filtrage par technicien pour la vue manager
  const [filterTech, setFilterTech] = useState<string>("_all")

  const filtered = filterTech === "_all"
    ? interventions
    : filterTech === "_none"
    ? interventions.filter((i) => !i.assignedUserId)
    : interventions.filter((i) => i.assignedUserId === filterTech)

  // Répartition par catégorie temporelle
  const grouped = CATEGORIES.reduce(
    (acc, cat) => {
      acc[cat.key] = filtered.filter((i) => getTemporalCategory(i.scheduledAt) === cat.key)
      return acc
    },
    {} as Record<string, PreventiveItem[]>
  )

  const total = filtered.length

  return (
    <div className="space-y-4">
      {/* Barre de filtres */}
      {(technicians.length > 0 || interventions.some((i) => !i.assignedUserId)) && (
        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-4 py-2.5">
          <span className="text-sm text-slate-500">Filtrer par technicien :</span>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFilterTech("_all")}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                filterTech === "_all"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Tous ({interventions.length})
            </button>
            <button
              onClick={() => setFilterTech("_none")}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                filterTech === "_none"
                  ? "bg-slate-700 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Non assignés ({interventions.filter((i) => !i.assignedUserId).length})
            </button>
            {technicians.map((t) => {
              const count = interventions.filter((i) => i.assignedUserId === t.id).length
              if (count === 0) return null
              return (
                <button
                  key={t.id}
                  onClick={() => setFilterTech(t.id)}
                  className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                    filterTech === t.id
                      ? "bg-green-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {t.name} ({count})
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Catégories */}
      {total === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">Aucune préventive pour ce filtre.</p>
      ) : (
        <div className="space-y-4">
          {CATEGORIES.map((cat) => (
            <CategorySection
              key={cat.key}
              category={cat}
              items={grouped[cat.key] ?? []}
              userNameMap={userNameMap}
              technicians={technicians}
              canAssign={canAssign}
            />
          ))}
        </div>
      )}
    </div>
  )
}
