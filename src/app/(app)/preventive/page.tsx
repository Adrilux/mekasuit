import Link from "next/link"
import { Plus, CalendarClock } from "lucide-react"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { queryGetPreventives } from "@/server/queries/interventions/query-get-preventives"
import { buildUserNameMap } from "@/server/queries/users/query-get-users-by-auth-ids"
import { queryGetUsersByTenant } from "@/server/queries/users/query-get-users-by-tenant"
import { Button } from "@/components/ui/button"
import { PreventiveBoard } from "@/components/preventive/preventive-board"

export default async function PreventivePage() {
  const session = await requireSession()

  const interventions = await queryGetPreventives(session)
  const canCreate = session.permissions.includes("intervention:create")

  // Résolution noms techniciens
  const assignedIds = interventions
    .map((i) => i.assignedUserId)
    .filter((id): id is string => !!id)
  const userNameMap = await buildUserNameMap([...new Set(assignedIds)])

  // Liste des techniciens disponibles pour l'assignation rapide
  const members = session.permissions.includes("user:read")
    ? await queryGetUsersByTenant(session)
    : []

  const technicians = members
    .filter((m) => m.isActive && ["technician", "workshop_manager"].includes(m.role))
    .map((m) => ({ id: m.authUserId, name: m.name }))

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Préventives</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {interventions.length} intervention{interventions.length !== 1 ? "s" : ""} planifiée{interventions.length !== 1 ? "s" : ""}
          </p>
        </div>
        {canCreate && (
          <Button asChild size="sm" className="self-start sm:self-auto">
            <Link href="/interventions/new?type=PREVENTIVE">
              <Plus className="w-4 h-4 mr-1" />
              Nouvelle préventive
            </Link>
          </Button>
        )}
      </div>

      {interventions.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <CalendarClock className="w-10 h-10 mx-auto mb-4 opacity-40" />
          <p className="text-base font-medium text-slate-500">Aucune préventive planifiée</p>
          <p className="text-sm mt-1">
            Créez des interventions de type <strong>Préventive</strong> avec une date planifiée pour les voir apparaître ici.
          </p>
          {canCreate && (
            <Button asChild size="sm" className="mt-4">
              <Link href="/interventions/new?type=PREVENTIVE">Créer une préventive</Link>
            </Button>
          )}
        </div>
      ) : (
        <PreventiveBoard
          interventions={interventions}
          userNameMap={userNameMap}
          technicians={technicians}
          sessionRole={session.role}
          canAssign={session.permissions.includes("intervention:assign")}
        />
      )}
    </div>
  )
}
