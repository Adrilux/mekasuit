"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Calendar, dateFnsLocalizer } from "react-big-calendar"
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns"
import { fr } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
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

const STATUS_OPACITY: Record<string, string> = {
  OPEN: "1",
  IN_PROGRESS: "1",
  PENDING_PARTS: "0.7",
  CLOSED: "0.4",
}

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

export function InterventionCalendar({ interventions, initialDate }: Props) {
  const router = useRouter()
  const [date, setDate] = useState(initialDate ?? new Date())
  const [view, setView] = useState<"month" | "week">("month")

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

  function prevMonth() { setDate((d) => subMonths(d, 1)) }
  function nextMonth() { setDate((d) => addMonths(d, 1)) }
  function goToday() { setDate(new Date()) }

  const monthLabel = format(date, "MMMM yyyy", { locale: fr })

  return (
    <div className="space-y-3">
      {/* Toolbar custom */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToday}>Aujourd&apos;hui</Button>
          <button onClick={prevMonth} className="p-1 rounded hover:bg-slate-100 text-slate-500">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={nextMonth} className="p-1 rounded hover:bg-slate-100 text-slate-500">
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-slate-700 capitalize">{monthLabel}</span>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-md p-1">
          {(["month", "week"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "px-3 py-1 rounded text-xs font-medium transition-colors",
                view === v ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {v === "month" ? "Mois" : "Semaine"}
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

      {/* Calendrier */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden" style={{ height: 560 }}>
        <Calendar
          localizer={localizer}
          events={events}
          date={date}
          view={view}
          onNavigate={setDate}
          onView={(v) => setView(v as "month" | "week")}
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
    </div>
  )
}
