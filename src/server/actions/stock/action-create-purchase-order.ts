"use server"

import { z } from "zod"
import { Prisma, ModuleName } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan, assertSiteAccess } from "@/lib/permissions/permission-checker-server"
import { assertModuleActive } from "@/lib/modules/module-access-checker"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { logAudit } from "@/lib/audit/audit-logger"

const schema = z.object({
  siteId: z.string().min(1),
  supplierId: z.string().min(1),
  items: z
    .array(
      z.object({
        stockItemId: z.string().min(1),
        quantityOrdered: z.coerce.number().int().min(1),
        unitPriceCents: z.coerce.number().int().min(0).default(0),
      }),
    )
    .min(1, "Au moins un article requis"),
  expectedDeliveryDate: z.string().optional(),
  notes: z.string().max(1000).optional(),
})

export async function actionCreatePurchaseOrder(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session.role, "stock:po:create")
    await assertModuleActive(session.tenantId, ModuleName.STOCK_MANAGEMENT)

    const data = schema.parse(input)
    assertSiteAccess(session.role, session.siteIds, data.siteId)

    const result = await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      const order = await tx.purchaseOrder.create({
        data: {
          tenantId: session.tenantId,
          siteId: data.siteId,
          supplierId: data.supplierId,
          createdBy: session.id,
          expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : null,
          notes: data.notes ?? null,
          items: {
            create: data.items.map((item) => ({
              tenantId: session.tenantId,
              stockItemId: item.stockItemId,
              quantityOrdered: item.quantityOrdered,
              unitPriceCents: item.unitPriceCents,
            })),
          },
        },
        select: { id: true },
      })

      await logAudit({
        tx,
        tenantId: session.tenantId,
        userId: session.id,
        action: "stock.purchase_order.create",
        entityType: "purchase_order",
        entityId: order.id,
        entityLabel: `Commande fournisseur`,
        changes: { itemCount: data.items.length },
      })

      return order
    })

    return success(result)
  } catch (error) {
    return handleServerActionError(error)
  }
}
