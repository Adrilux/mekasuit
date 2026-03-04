"use server"

import { z } from "zod"
import { Prisma, MovementType } from "@prisma/client"
import { ModuleName } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan, assertSiteAccess } from "@/lib/permissions/permission-checker-server"
import { assertModuleActive } from "@/lib/modules/module-access-checker"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError, ValidationError } from "@/lib/errors/app-error-classes"

const schema = z.object({
  siteId: z.string().min(1),
  barcode: z.string().min(1, "Code-barre requis"),
  type: z.enum(["IN", "OUT"]),
  quantity: z.coerce.number().int().min(1).default(1),
  reason: z.string().max(300).optional(),
})

export async function actionStockMovementBarcode(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session, "stock:movement")
    await assertModuleActive(session.tenantId, ModuleName.STOCK_MANAGEMENT)

    const data = schema.parse(input)
    assertSiteAccess(session, data.siteId)

    const result = await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      // Cherche l'article par référence (= code-barre) sur ce site
      const stockItem = await tx.stockItem.findFirst({
        where: { siteId: data.siteId, reference: data.barcode },
        select: { id: true, name: true, reference: true, unit: true, quantityOnHand: true },
      })

      if (!stockItem) {
        throw new NotFoundError("Article", `référence "${data.barcode}"`)
      }

      if (data.type === "OUT" && stockItem.quantityOnHand < data.quantity) {
        throw new ValidationError(
          `Stock insuffisant pour "${stockItem.name}" : ${stockItem.quantityOnHand} disponible(s)`
        )
      }

      const delta = data.type === "IN" ? data.quantity : -data.quantity

      await tx.stockItem.update({
        where: { id: stockItem.id },
        data: { quantityOnHand: { increment: delta } },
      })

      await tx.stockMovement.create({
        data: {
          tenantId: session.tenantId,
          stockItemId: stockItem.id,
          type: data.type as MovementType,
          quantity: Math.abs(delta),
          reason: data.reason ?? `Scan code-barre (${data.type === "IN" ? "entrée" : "sortie"})`,
          operatorId: session.id,
        },
      })

      return {
        stockItem: {
          id: stockItem.id,
          name: stockItem.name,
          reference: stockItem.reference,
          unit: stockItem.unit,
          newQuantity: stockItem.quantityOnHand + delta,
        },
      }
    })

    return success(result)
  } catch (error) {
    return handleServerActionError(error)
  }
}
