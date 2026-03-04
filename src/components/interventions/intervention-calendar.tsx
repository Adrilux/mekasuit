"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Calendar, dateFnsLocalizer } from "react-big-calendar"
import {
  format, parse, startOfWeek, getDay,
  addMonths, subMonths, addWeeks, subWeeks, addDays, subDays,
  startOfQuarter, endOfQuarter, addQuarters, subQuarters,
  startOfYear, endOfYear, addYears, subYears,
  isWithinInterval, isSameMonth, startOfMonth, endOfMonth,
} from "date-fns"
import { fr } from "date-fns/locale"
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils/cn"
import type { CalendarIntervention } from "@/server/queries/interventions/query-get-interventions-calendar"
import "react-big-calendar/lib/css/react-big-calendar.css"

const locales = { fr }

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { locale: fr }),
  getDay,
  locales,
})

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "#94a3b8",
  MEDIUM: "#3b82f6",
  HIGH: "#f59e0b",
  CRITICAL: "#ef4444",
}

const PRIORITY_BG: Record<string, string> = {
  LOW: "bg-slate-400",
  MEDIUM: "bg-blue-500",
  HIGH: "bg-amber-500",
  CRITICAL: "bg-red-500",
}

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Ouvert",
  IN_PROGRESS: "En cours",
  PENDING_PARTS: "Attente pièces",
  CLOSED: "Clôturé",
  CANCELLED: "Annulé",
}

const STATUS_OPACITY: Record<string, string> = {
  OPEN: "1",
  IN_PROGRESS: "1",
  PENDING_PARTS: "0.7",
  CLOSED: "0.4",
}

type ViewType = "day" | "week" | "month" | "quarter" | "semester" | "year"

type Props = {
  interventions: CalendarIntervention[]
  initialDate?: Date
}

type CalEvent = {
  id: string
  title: string
  start: Date
  end: Date
  resource: CalendarIntervention
}

const VIEWS: { key: ViewType; label: string }[] = [
  { key: "day", label: "Jour" },
  { key: "week", label: "Semaine" },
  { key: "month", label: "Mois" },
  { key: "quarter", label: "Trimestre" },
  { key: "semester", label: "Semestre" },
  { key: "year", label: "Année" },
]

function getPeriodBounds(date: Date, view: ViewType): { start: Date; end: Date } {
  switch (view) {
    case "day":
      return { start: date, end: date }
    case "week":
      return {
        start: startOfWeek(date, { locale: fr }),
        end: new Date(startOfWeek(date, { locale: fr }).getTime() + 6 * 86400000),
      }
    case "month":
      return { start: startOfMonth(date), end: endOfMonth(date) }
    case "quarter":
      return { start: startOfQuarter(date), end: endOfQuarter(date) }
    case "semester": {
      const month = date.getMonth()
      const year = date.getFullYear()
      const isFirstHalf = month < 6
      return {
        start: new Date(year, isFirstHalf ? 0 : 6, 1),
        end: new Date(year, isFirstHalf ? 5 : 11, 31, 23, 59, 59),
      }
    }
    case "year":
      return { start: startOfYear(date), end: endOfYear(date) }
  }
}

function getPeriodLabel(date: Date, view: ViewType): string {
  switch (view) {
    case "day":
      return format(date, "EEEE d MMMM yyyy", { locale: fr })
    case "week": {
      const s = startOfWeek(date, { locale: fr })
      const e = new Date(s.getTime() + 6 * 86400000)
      return `${format(s, "d MMM", { locale: fr })} – ${format(e, "d MMM yyyy", { locale: fr })}`
    }
    case "month":
      return format(date, "MMMM yyyy", { locale: fr })
    case "quarter": {
      const q = Math.floor(date.getMonth() / 3) + 1
      return `T${q} ${date.getFullYear()}`
    }
    case "semester": {
      const s = date.getMonth() < 6 ? "1er" : "2e"
      return `${s} semestre ${date.getFullYear()}`
    }
    case "year":
      return `${date.getFullYear()}`
  }
}

function navigateDate(date: Date, view: ViewType, dir: 1 | -1): Date {
  switch (view) {
    case "day": return dir === 1 ? addDays(date, 1) : subDays(date, 1)
    case "week": return dir === 1 ? addWeeks(date, 1) : subWeeks(date, 1)
    case "month": return dir === 1 ? addMonths(date, 1) : subMonths(date, 1)
    case "quarter": return dir === 1 ? addQuarters(date, 1) : subQuarters(date, 1)
    case "semester": return dir === 1 ? addMonths(date, 6) : subMonths(date, 6)
    case "year": return dir === 1 ? addYears(date, 1) : subYears(date, 1)
  }
}

// Groups interventions by month for aggregate views
function groupByMonth(interventions: CalendarIntervention[], start: Date, end: Date) {
  const months: { label: string; date: Date; items: CalendarIntervention[] }[] = []
  let cursor = startOfMonth(start)
  while (cursor <= end) {
    const monthEnd = endOfMonth(cursor)
    const items = interventions.filter((i) => {
      if (!i.scheduledAt) return false
      const d = new Date(i.scheduledAt)
      return isWithinInterval(d, { start: cursor, end: monthEnd })
    })
    months.push({ label: format(cursor, "MMMM yyyy", { locale: fr }), date: cursor, items })
    cursor = addMonths(cursor, 1)
  }
  return months
}

function AggregateView({
  interventions,
  date,
  view,
  onSelectIntervention,
}: {
  interventions: CalendarIntervention[]
  date: Date
  view: "quarter" | "semester" | "year"
  onSelectIntervention: (id: string) => void
}) {
  const { start, end } = getPeriodBounds(date, view)
  const months = groupByMonth(interventions, start, end)
  const total = months.reduce((s, m) => s + m.items.length, 0)

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">{total} intervention{total !== 1 ? "s" : ""} planifiée{total !== 1 ? "s" : ""} sur la période</p>
      {months.map((month) => (
        <div key={month.label} className="border border-slate-200 rounded-lg overflow-hidden">
          <div className={cn(
            "flex items-center justify-between px-4 py-2 text-sm font-semibold",
            isSameMonth(month.date, new Date()) ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-700"
          )}>
            <span className="capitalize">{month.label}</span>
            <span className="text-xs font-normal opacity-70">{month.items.length} intervention{month.items.length !== 1 ? "s" : ""}</span>
          </div>
          {month.items.length === 0 ? (
            <div className="px-4 py-3 text-xs text-slate-400 italic">Aucune intervention planifiée</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {month.items
                .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())
                .map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onSelectIntervention(item.id)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors"
                  >
                    <span className={cn("w-2 h-2 rounded-full flex-shrink-0", PRIORITY_BG[item.priority] ?? "bg-slate-400")} />
                    <span className="text-xs text-slate-500 w-16 flex-shrink-0">
                      {format(new Date(item.scheduledAt!), "dd MMM", { locale: fr })}
                    </span>
                    <span className="text-sm text-slate-900 flex-1 truncate">{item.title}</span>
                    <span className="text-xs text-slate-400 flex-shrink-0">{STATUS_LABEL[item.status] ?? item.status}</span>
                  </button>
                ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export function InterventionCalendar({ interventions, initialDate }: Props) {
  const router = useRouter()
  const [date, setDate] = useState(initialDate ?? new Date())
  const [view, setView] = useState<ViewType>("month")

  const events = useMemo<CalEvent[]>(() =>
    interventions
      .filter((i) => i.scheduledAt)
      .map((i) => ({
        id: i.id,
        title: i.title,
        start: new Date(i.scheduledAt!),
        end: new Date(i.scheduledAt!),
        resource: i,
      })),
    [interventions]
  )

  function eventStyleGetter(event: CalEvent) {
    const color = PRIORITY_COLORS[event.resource.priority] ?? "#3b82f6"
    const opacity = STATUS_OPACITY[event.resource.status] ?? "1"
    return {
      style: {
        backgroundColor: color,
        opacity,
        borderRadius: "4px",
        border: "none",
        color: "white",
        fontSize: "11px",
        padding: "1px 4px",
      },
    }
  }

  function handleSelectEvent(event: CalEvent) {
    router.push(`/interventions/${event.id}`)
  }

  const isAggregateView = view === "quarter" || view === "semester" || view === "year"
  const rbcView = (view === "day" || view === "week" || view === "month") ? view : "month"

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setDate(new Date())}>Aujourd&apos;hui</Button>
          <button
            onClick={() => setDate((d) => navigateDate(d, view, -1))}
            className="p-1 rounded hover:bg-slate-100 text-slate-500"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDate((d) => navigateDate(d, view, 1))}
            className="p-1 rounded hover:bg-slate-100 text-slate-500"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-slate-700 capitalize">
            {getPeriodLabel(date, view)}
          </span>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-md p-1">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={cn(
                "px-3 py-1 rounded text-xs font-medium transition-colors",
                view === v.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Légende priorités */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        {Object.entries(PRIORITY_COLORS).map(([p, c]) => (
          <span key={p} className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: c }} />
            {p === "LOW" ? "Basse" : p === "MEDIUM" ? "Normale" : p === "HIGH" ? "Urgente" : "Critique"}
          </span>
        ))}
      </div>

      {/* Vue agrégée (trimestre / semestre / année) */}
      {isAggregateView ? (
        <AggregateView
          interventions={interventions}
          date={date}
          view={view as "quarter" | "semester" | "year"}
          onSelectIntervention={(id) => router.push(`/interventions/${id}`)}
        />
      ) : (
        /* Calendrier react-big-calendar (jour / semaine / mois) */
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden" style={{ height: 560 }}>
          <Calendar
            localizer={localizer}
            events={events}
            date={date}
            view={rbcView}
            onNavigate={setDate}
            onView={(v) => setView(v as ViewType)}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventStyleGetter}
            culture="fr"
            toolbar={false}
            messages={{
              noEventsInRange: "Aucune intervention planifiée sur cette période",
              showMore: (count) => `+${count} autres`,
            }}
            popup
            style={{ height: "100%" }}
          />
        </div>
      )}
    </div>
  )
}
