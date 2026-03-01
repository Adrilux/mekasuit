import { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/auth-session-helpers"
import { queryGetMachinesBySite } from "@/server/queries/machines/query-get-machines-by-site"
import { buildCsv, csvResponse } from "@/lib/csv/csv-builder"

const STATUS_LABELS: Record<string, string> = {
  OPERATIONAL: "Opérationnelle",
  UNDER_MAINTENANCE: "En maintenance",
  DECOMMISSIONED: "Hors service",
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return new Response("Unauthorized", { status: 401 })

  const { searchParams } = req.nextUrl
  const siteId = searchParams.get("siteId")
  if (!siteId) return new Response("Missing siteId", { status: 400 })

  const machines = await queryGetMachinesBySite(session, {
    siteId,
    search: searchParams.get("search") ?? undefined,
    status: searchParams.get("status") ?? undefined,
  })

  const headers = ["Nom", "N° série", "Catégorie", "Fabricant", "Modèle", "Statut", "Mise en service"]
  const rows = machines.map((m) => [
    m.name,
    m.serialNumber ?? "",
    m.category ?? "",
    m.manufacturer ?? "",
    m.model ?? "",
    STATUS_LABELS[m.status] ?? m.status,
    m.installedAt ? new Date(m.installedAt).toLocaleDateString("fr-FR") : "",
  ])

  return csvResponse(buildCsv(headers, rows), `machines-${siteId}-${new Date().toISOString().slice(0, 10)}.csv`)
}
