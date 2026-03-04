"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  AlertTriangle, Clock, CalendarCheck, CalendarClock,
  User, ChevronDown, Loader2, RefreshCw, Wrench,
  LayoutGrid, List, ArrowUpDown,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { InterventionStatusBadge } from "@/components/interventions/intervention-status-badge"
import { actionAssignIntervention } from "@/server/actions/interventions/action-assign-intervention"
import type { PreventiveItem } from "@/server/queries/interventions/query-get-preventives"
import { cn } from "@/lib/utils/cn"

type Technician = { id: string; name: string }

type Props = {
  interventions: PreventiveItem[]
  userNameMap: Map<string, string>
  technicians: Technician[]
  sessionRole: string
  canAssign: boolean
}

type SortKey = "date" | "priority" | "status"
type DisplayMode = "board" | "list"

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
    dotClass: "bg-red-500",
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
    dotClass: "bg-amber-500",
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
    dotClass: "bg-blue-500",
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
    dotClass: "bg-slate-400",
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
    dotClass: "bg-slate-300",
  },
] as const

const PRIORITY_LABELS: Record<string, string> = {
  CRITICAL: "Critique", HIGH: "Haute", MEDIUM: "Normale", LOW: "Basse",
}
const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "text-red-600 bg-red-50",
  HIGH: "text-orange-600 bg-orange-50",
  MEDIUM: "text-blue-600 bg-blue-50",
  LOW: "text-slate-500 bg-slate-50",
}
const PRIORITY_ORDER: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
const RECURRENCE_LABELS: Record<string, string> = {
  WEEKLY: "Hebdo", BIWEEKLY: "2 sem.", MONTHLY: "Mensuel",
  QUARTERLY: "Trimest.", SEMIANNUAL: "Semestriel", ANNUAL: "Annuel", CUSTOM: "Custom",
}

function formatDate(date: Date | null): string {
  if (!date) return "—"
  return new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
}

function sortItems(items: PreventiveItem[], sort: SortKey): PreventiveItem[] {
  return [...items].sort((a, b) => {
    if (sort === "date") {
      if (!a.scheduledAt && !b.scheduledAt) return 0
      if (!a.scheduledAt) return 1
      if (!b.scheduledAt) return -1
      return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    }
    if (sort === "priority") {
      return (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99)
    }
    if (sort === "status") {
      return a.status.localeCompare(b.status)
    }
    return 0
  })
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

  return (
    <div className="flex items-center gap-1">
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

// ── BOARD CARD ────────────────────────────────────────────────────────────────
function PreventiveCard({
  item, userNameMap, technicians, canAssign,
}: {
  item: PreventiveItem
  userNameMap: Map<string, string>
  technicians: Technician[]
  canAssign: boolean
}) {
  const assigneeName = item.assignedUserId ? (userNameMap.get(item.assignedUserId) ?? "—") : null

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3.5 hover:border-slate-300 hover:shadow-sm transition-all">
      <Link
        href={`/interventions/${item.id}`}
        className="font-medium text-slate-900 text-sm hover:text-blue-600 block leading-tight"
      >
        {item.title}
      </Link>

      {item.machine && (
        <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
          <Wrench className="w-3 h-3" />
          {item.machine.name}
        </div>
      )}

      <div className="flex items-center justify-between mt-2 flex-wrap gap-1">
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${PRIORITY_COLORS[item.priority] ?? ""}`}>
            {PRIORITY_LABELS[item.priority] ?? item.priority}
          </span>
          {item.recurrenceType && (
            <span className="text-xs bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <RefreshCw className="w-2.5 h-2.5" />
              {RECURRENCE_LABELS[item.recurrenceType] ?? item.recurrenceType}
            </span>
          )}
        </div>
        <InterventionStatusBadge status={item.status as never} />
      </div>

      <p className="text-xs text-slate-400 mt-1.5">{item.site.name}</p>
      {item.scheduledAt && (
        <p className="text-xs text-slate-500 mt-0.5">
          Planifié : <span className="font-medium">{formatDate(item.scheduledAt)}</span>
        </p>
      )}

      <div className="mt-1.5">
        {canAssign ? (
          <AssignSelect
            interventionId={item.id}
            assignedUserId={item.assignedUserId}
            technicians={technicians}
            userNameMap={userNameMap}
          />
        ) : assigneeName ? (
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <User className="w-3.5 h-3.5" />
            {assigneeName}
          </div>
        ) : (
          <p className="text-xs text-slate-300 italic">Non assigné</p>
        )}
      </div>
    </div>
  )
}

// ── LIST ROW ──────────────────────────────────────────────────────────────────
function PreventiveRow({
  item, userNameMap, technicians, canAssign, dotClass,
}: {
  item: PreventiveItem
  userNameMap: Map<string, string>
  technicians: Technician[]
  canAssign: boolean
  dotClass: string
}) {
  const assigneeName = item.assignedUserId ? (userNameMap.get(item.assignedUserId) ?? "—") : null

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
      <span className={cn("w-2 h-2 rounded-full flex-shrink-0", dotClass)} />

      {/* Date */}
      <span className="text-xs text-slate-400 w-16 flex-shrink-0 tabular-nums">
        {formatDate(item.scheduledAt)}
      </span>

      {/* Titre + machine */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/interventions/${item.id}`}
          className="text-sm font-medium text-slate-900 hover:text-blue-600 truncate block"
        >
          {item.title}
        </Link>
        {item.machine && (
          <span className="text-xs text-slate-400 flex items-center gap-0.5">
            <Wrench className="w-2.5 h-2.5" />
            {item.machine.name}
          </span>
        )}
      </div>

      {/* Priorité */}
      <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded hidden sm:block", PRIORITY_COLORS[item.priority] ?? "")}>
        {PRIORITY_LABELS[item.priority] ?? item.priority}
      </span>

      {/* Récurrence */}
      {item.recurrenceType ? (
        <span className="text-xs bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded hidden md:flex items-center gap-0.5">
          <RefreshCw className="w-2.5 h-2.5" />
          {RECURRENCE_LABELS[item.recurrenceType] ?? item.recurrenceType}
        </span>
      ) : (
        <span className="w-16 hidden md:block" />
      )}

      {/* Assigné */}
      <div className="w-28 flex-shrink-0 hidden lg:block">
        {canAssign ? (
          <AssignSelect
            interventionId={item.id}
            assignedUserId={item.assignedUserId}
            technicians={technicians}
            userNameMap={userNameMap}
          />
        ) : (
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <User className="w-3 h-3" />
            {assigneeName ?? <span className="italic">Non assigné</span>}
          </span>
        )}
      </div>

      {/* Statut */}
      <div className="flex-shrink-0">
        <InterventionStatusBadge status={item.status as never} />
      </div>
    </div>
  )
}

// ── CATEGORY SECTION (board) ──────────────────────────────────────────────────
function CategorySection({
  category, items, userNameMap, technicians, canAssign,
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

// ── CATEGORY SECTION (list) ───────────────────────────────────────────────────
function CategoryListSection({
  category, items, userNameMap, technicians, canAssign,
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
    <section className="rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={`w-full flex items-center justify-between px-4 py-2.5 ${category.headerBg} border-b ${category.headerBg} transition-colors`}
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
        <div className="bg-white divide-y divide-slate-100">
          {items.map((item) => (
            <PreventiveRow
              key={item.id}
              item={item}
              userNameMap={userNameMap}
              technicians={technicians}
              canAssign={canAssign}
              dotClass={category.dotClass}
            />
          ))}
        </div>
      )}
    </section>
  )
}

// ── MAIN BOARD ────────────────────────────────────────────────────────────────
export function PreventiveBoard({ interventions, userNameMap, technicians, canAssign }: Props) {
  const [filterTech, setFilterTech] = useState<string>("_all")
  const [sort, setSort] = useState<SortKey>("date")
  const [mode, setMode] = useState<DisplayMode>("board")

  const filtered = filterTech === "_all"
    ? interventions
    : filterTech === "_none"
    ? interventions.filter((i) => !i.assignedUserId)
    : interventions.filter((i) => i.assignedUserId === filterTech)

  const sorted = sortItems(filtered, sort)

  const grouped = CATEGORIES.reduce(
    (acc, cat) => {
      acc[cat.key] = sorted.filter((i) => getTemporalCategory(i.scheduledAt) === cat.key)
      return acc
    },
    {} as Record<string, PreventiveItem[]>
  )

  const total = filtered.length

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Filtre technicien */}
        {(technicians.length > 0 || interventions.some((i) => !i.assignedUserId)) && (
          <div className="flex items-center gap-2 flex-wrap flex-1">
            <span className="text-xs text-slate-500">Technicien :</span>
            <button
              onClick={() => setFilterTech("_all")}
              className={cn(
                "text-xs px-2.5 py-1 rounded-full font-medium transition-colors",
                filterTech === "_all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              Tous ({interventions.length})
            </button>
            <button
              onClick={() => setFilterTech("_none")}
              className={cn(
                "text-xs px-2.5 py-1 rounded-full font-medium transition-colors",
                filterTech === "_none" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
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
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-full font-medium transition-colors",
                    filterTech === t.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {t.name} ({count})
                </button>
              )
            })}
          </div>
        )}

        {/* Sort + Mode */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Sort */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-300"
            >
              <option value="date">Date</option>
              <option value="priority">Priorité</option>
              <option value="status">Statut</option>
            </select>
          </div>

          {/* Display mode */}
          <div className="flex items-center bg-slate-100 rounded-md p-0.5">
            <button
              onClick={() => setMode("board")}
              className={cn(
                "p-1.5 rounded transition-colors",
                mode === "board" ? "bg-white shadow-sm text-slate-900" : "text-slate-400 hover:text-slate-600"
              )}
              title="Vue cartes"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setMode("list")}
              className={cn(
                "p-1.5 rounded transition-colors",
                mode === "list" ? "bg-white shadow-sm text-slate-900" : "text-slate-400 hover:text-slate-600"
              )}
              title="Vue liste"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {total === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">Aucune préventive pour ce filtre.</p>
      ) : (
        <div className="space-y-3">
          {CATEGORIES.map((cat) =>
            mode === "list" ? (
              <CategoryListSection
                key={cat.key}
                category={cat}
                items={grouped[cat.key] ?? []}
                userNameMap={userNameMap}
                technicians={technicians}
                canAssign={canAssign}
              />
            ) : (
              <CategorySection
                key={cat.key}
                category={cat}
                items={grouped[cat.key] ?? []}
                userNameMap={userNameMap}
                technicians={technicians}
                canAssign={canAssign}
              />
            )
          )}
        </div>
      )}
    </div>
  )
}
