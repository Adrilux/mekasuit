import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { queryGetInterventionsCalendar } from "@/server/queries/interventions/query-get-interventions-calendar"
import { queryGetSitesByTenant } from "@/server/queries/sites/query-get-sites-by-tenant"
import { startOfYear, endOfYear, subYears, addYears } from "date-fns"
import { InterventionCalendar } from "@/components/interventions/intervention-calendar"
import { CalendarDays } from "lucide-react"

export default async function PlanningPage() {
  const session = await requireSession()
  assertCan(session, "intervention:read")

  const sites = await queryGetSitesByTenant(session)
  const activeSites = sites.filter((s) => s.isActive)
  const siteId = activeSites[0]?.id

  const now = new Date()
  // Wide range to support year/semester views (previous + current + next year)
  const from = startOfYear(subYears(now, 1))
  const to = endOfYear(addYears(now, 1))

  const interventions = siteId
    ? await queryGetInterventionsCalendar(session, siteId, from, to)
    : []

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <CalendarDays className="w-5 h-5 text-slate-500" />
        <h1 className="text-xl font-bold text-slate-900">Planning</h1>
      </div>
      <InterventionCalendar interventions={interventions} initialDate={now} />
    </div>
  )
}
