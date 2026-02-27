import { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/auth-session-helpers"
import { queryGetStockItemsBySite } from "@/server/queries/stock/query-get-stock-items-by-site"
import { buildCsv, csvResponse } from "@/lib/csv/csv-builder"

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return new Response("Unauthorized", { status: 401 })

  const { searchParams } = req.nextUrl
  const siteId = searchParams.get("siteId")
  if (!siteId) return new Response("Missing siteId", { status: 400 })

  const allItems = await queryGetStockItemsBySite(session, {
    siteId,
    search: searchParams.get("search") ?? undefined,
  })
  const items = searchParams.get("lowStock") === "1"
    ? allItems.filter((i) => i.minimumLevel > 0 && i.quantityOnHand <= i.minimumLevel)
    : allItems

  const headers = ["Référence", "Désignation", "Stock", "Seuil minimum", "Unité", "Coût unitaire (€)"]
  const rows = items.map((i) => [
    i.reference,
    i.name,
    i.quantityOnHand,
    i.minimumLevel,
    i.unit,
    i.unitCostCents > 0 ? (i.unitCostCents / 100).toFixed(2) : "",
  ])

  return csvResponse(buildCsv(headers, rows), `stock-${siteId}-${new Date().toISOString().slice(0, 10)}.csv`)
}
