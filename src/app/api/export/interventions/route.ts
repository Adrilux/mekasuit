import { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/auth-session-helpers"
import { queryGetInterventionsBySite } from "@/server/queries/interventions/query-get-interventions-by-site"
import { buildUserNameMap } from "@/server/queries/users/query-get-users-by-auth-ids"
import { buildCsv, csvResponse } from "@/lib/csv/csv-builder"
import type { InterventionStatus, InterventionType, InterventionPriority } from "@prisma/client"

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Ouvert",
  IN_PROGRESS: "En cours",
  PENDING_PARTS: "Attente pièces",
  CLOSED: "Fermé",
  CANCELLED: "Annulé",
}

const TYPE_LABELS: Record<string, string> = {
  CORRECTIVE: "Corrective",
  PREVENTIVE: "Préventive",
  IMPROVEMENT: "Amélioration",
}

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Basse",
  MEDIUM: "Normale",
  HIGH: "Haute",
  CRITICAL: "Critique",
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return new Response("Unauthorized", { status: 401 })

  const { searchParams } = req.nextUrl
  const siteId = searchParams.get("siteId")
  if (!siteId) return new Response("Missing siteId", { status: 400 })

  const interventions = await queryGetInterventionsBySite(session, {
    siteId,
    status: searchParams.get("status") as InterventionStatus | undefined ?? undefined,
    type: searchParams.get("type") as InterventionType | undefined ?? undefined,
    priority: searchParams.get("priority") as InterventionPriority | undefined ?? undefined,
    search: searchParams.get("search") ?? undefined,
  })

  const assignedIds = interventions
    .map((i) => i.assignedUserId)
    .filter((id): id is string => !!id)
  const userNames = await buildUserNameMap([...new Set(assignedIds)])

  const headers = ["Titre", "Type", "Priorité", "Statut", "Machine", "Technicien", "Planifiée le", "Créée le", "Fermée le"]
  const rows = interventions.map((i) => [
    i.title,
    TYPE_LABELS[i.type] ?? i.type,
    PRIORITY_LABELS[i.priority] ?? i.priority,
    STATUS_LABELS[i.status] ?? i.status,
    i.machine?.name ?? "",
    i.assignedUserId ? (userNames.get(i.assignedUserId) ?? "") : "",
    i.scheduledAt ? new Date(i.scheduledAt).toLocaleDateString("fr-FR") : "",
    new Date(i.createdAt).toLocaleDateString("fr-FR"),
    i.closedAt ? new Date(i.closedAt).toLocaleDateString("fr-FR") : "",
  ])

  return csvResponse(buildCsv(headers, rows), `interventions-${siteId}-${new Date().toISOString().slice(0, 10)}.csv`)
}
