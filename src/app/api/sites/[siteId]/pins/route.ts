import { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/auth-session-helpers"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { Prisma } from "@prisma/client"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> },
) {
  const { siteId } = await params
  const session = await getSession()
  if (!session) return new Response("Unauthorized", { status: 401 })
  if (!session.permissions.includes("site:update")) return new Response("Forbidden", { status: 403 })

  let pins: Record<string, { x: number; y: number }>
  try {
    const body = await req.json() as { pins: Record<string, { x: number; y: number }> }
    pins = body.pins ?? {}
  } catch {
    return new Response("Invalid JSON", { status: 400 })
  }

  const site = await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    return tx.site.findFirst({ where: { id: siteId }, select: { id: true } })
  })
  if (!site) return new Response("Site introuvable", { status: 404 })

  await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
    await tx.site.update({
      where: { id: siteId },
      data: { machinePins: pins },
    })
  })

  return Response.json({ success: true })
}
