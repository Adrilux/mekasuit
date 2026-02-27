import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/auth-session-helpers"
import { queryGlobalSearch } from "@/server/queries/search/query-global-search"

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const q = req.nextUrl.searchParams.get("q") ?? ""
  if (q.trim().length < 2) return NextResponse.json([])

  const results = await queryGlobalSearch(session, q)
  return NextResponse.json(results)
}
