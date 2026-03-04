"use server"

import { z } from "zod"
import { Prisma, ModuleName } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan, assertSiteAccess } from "@/lib/permissions/permission-checker-server"
import { assertModuleActive } from "@/lib/modules/module-access-checker"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError, ValidationError } from "@/lib/errors/app-error-classes"
import { sendNotificationToMany } from "@/lib/notifications/notification-sender"

const schema = z.object({
  fromSiteId:  z.string().min(1),
  toSiteId:    z.string().min(1),
  stockItemId: z.string().min(1),
  quantity:    z.number().int().min(1, "Quantité minimum : 1"),
  reason:      z.string().max(300).optional(),
})

export async function actionCreateStockTransfer(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session, "stock:transfer:create")
    await assertModuleActive(session.tenantId, ModuleName.INTER_SITE_TRANSFERS)

    const data = schema.parse(input)

    if (data.fromSiteId === data.toSiteId) {
      throw new ValidationError("Le site source et le site destination doivent être différents")
    }

    const result = await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      // Vérifier accès au site source
      assertSiteAccess(session, data.fromSiteId)

      // Vérifier l'article existe et appartient au site source
      const stockItem = await tx.stockItem.findFirst({
        where: { id: data.stockItemId, siteId: data.fromSiteId },
        select: { id: true, name: true, quantityOnHand: true },
      })
      if (!stockItem) throw new NotFoundError("Article de stock", data.stockItemId)

      if (stockItem.quantityOnHand < data.quantity) {
        throw new ValidationError(
          `Stock insuffisant : ${stockItem.quantityOnHand} disponible(s), ${data.quantity} demandée(s)`
        )
      }

      // Vérifier que le site destination existe dans le tenant
      const toSite = await tx.site.findFirst({
        where: { id: data.toSiteId, tenantId: session.tenantId, isActive: true },
        select: { id: true, name: true },
      })
      if (!toSite) throw new NotFoundError("Site de destination", data.toSiteId)

      const transfer = await tx.stockTransferRequest.create({
        data: {
          tenantId:      session.tenantId,
          fromSiteId:    data.fromSiteId,
          toSiteId:      data.toSiteId,
          stockItemId:   data.stockItemId,
          quantity:      data.quantity,
          status:        "PENDING",
          requestedById: session.id,
          reason:        data.reason ?? null,
        },
      })

      // Notifier les utilisateurs avec notifications:receive (approbateurs transferts)
      const approvers = await tx.tenantUser.findMany({
        where: {
          tenantId: session.tenantId,
          isActive: true,
          tenantRole: { permissions: { has: "notifications:receive" } },
        },
        select: { authUserId: true },
      })
      const approverIds = approvers
        .map((u) => u.authUserId)
        .filter((id) => id !== session.id)

      await sendNotificationToMany(tx, approverIds, {
        tenantId: session.tenantId,
        type: "TRANSFER_PENDING",
        title: "Transfert de stock en attente",
        body: `${data.quantity} × ${stockItem.name} — vers ${toSite.name}`,
        link: `/stock/transfers/${transfer.id}`,
      })

      return transfer
    })

    return success(result)
  } catch (error) {
    return handleServerActionError(error)
  }
}
