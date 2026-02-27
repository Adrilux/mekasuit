import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/auth-session-helpers"
import { queryGetStockItemsBySite } from "@/server/queries/stock/query-get-stock-items-by-site"

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const siteId = req.nextUrl.searchParams.get("siteId")
  if (!siteId) return NextResponse.json({ error: "siteId requis" }, { status: 400 })

  const items = await queryGetStockItemsBySite(session, siteId)
  return NextResponse.json(items)
}
