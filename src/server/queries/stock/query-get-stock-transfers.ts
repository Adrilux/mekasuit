import { prisma } from "@/lib/db/prisma-client-singleton"
import { withTenantReadContext } from "@/lib/db/prisma-with-rls-context"
import type { SessionUser } from "@/lib/auth/auth-session-helpers"

export async function queryGetStockTransfers(session: SessionUser) {
  return withTenantReadContext(session.tenantId, () =>
    prisma.stockTransferRequest.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        quantity: true,
        status: true,
        reason: true,
        requestedById: true,
        approvedById: true,
        createdAt: true,
        resolvedAt: true,
        stockItem:  { select: { id: true, name: true, reference: true, unit: true } },
        fromSite:   { select: { id: true, name: true } },
        toSite:     { select: { id: true, name: true } },
      },
    })
  )
}

export async function queryGetStockTransferById(session: SessionUser, transferId: string) {
  return withTenantReadContext(session.tenantId, () =>
    prisma.stockTransferRequest.findFirst({
      where: { id: transferId, tenantId: session.tenantId },
      select: {
        id: true,
        quantity: true,
        status: true,
        reason: true,
        requestedById: true,
        approvedById: true,
        createdAt: true,
        resolvedAt: true,
        stockItem:  { select: { id: true, name: true, reference: true, unit: true } },
        fromSite:   { select: { id: true, name: true } },
        toSite:     { select: { id: true, name: true } },
      },
    })
  )
}

export async function queryGetPendingTransfersCount(session: SessionUser): Promise<number> {
  return withTenantReadContext(session.tenantId, () =>
    prisma.stockTransferRequest.count({
      where: { tenantId: session.tenantId, status: "PENDING" },
    })
  )
}

export type StockTransferItem = Awaited<ReturnType<typeof queryGetStockTransfers>>[number]
