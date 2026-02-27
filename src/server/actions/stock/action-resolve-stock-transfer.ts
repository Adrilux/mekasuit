"use server"

import { z } from "zod"
import { Prisma, ModuleName } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { assertModuleActive } from "@/lib/modules/module-access-checker"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError, ValidationError } from "@/lib/errors/app-error-classes"
import { sendNotification } from "@/lib/notifications/notification-sender"

const schema = z.object({
  transferId: z.string().min(1),
  action:     z.enum(["APPROVE", "REJECT"]),
})

export async function actionResolveStockTransfer(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session.role, "stock:transfer:approve")
    await assertModuleActive(session.tenantId, ModuleName.INTER_SITE_TRANSFERS)

    const { transferId, action } = schema.parse(input)

    const result = await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      const transfer = await tx.stockTransferRequest.findFirst({
        where: { id: transferId, tenantId: session.tenantId },
        select: {
          id: true, status: true, quantity: true,
          fromSiteId: true, toSiteId: true,
          stockItemId: true, requestedById: true,
          stockItem: { select: { name: true, quantityOnHand: true } },
          fromSite: { select: { name: true } },
          toSite: { select: { name: true } },
        },
      })
      if (!transfer) throw new NotFoundError("Demande de transfert", transferId)

      if (transfer.status !== "PENDING") {
        throw new ValidationError("Cette demande a déjà été traitée")
      }

      if (action === "REJECT") {
        await tx.stockTransferRequest.update({
          where: { id: transferId },
          data: { status: "REJECTED", approvedById: session.id, resolvedAt: new Date() },
        })

        // Notifier le demandeur
        await sendNotification(tx, {
          tenantId: session.tenantId,
          userId:   transfer.requestedById,
          type:     "TRANSFER_RESOLVED",
          title:    "Transfert refusé",
          body:     `${transfer.quantity} × ${transfer.stockItem.name} → ${transfer.toSite.name}`,
          link:     `/stock/transfers/${transferId}`,
        })

        return { status: "REJECTED" }
      }

      // APPROVE — vérifier le stock est toujours suffisant
      if (transfer.stockItem.quantityOnHand < transfer.quantity) {
        throw new ValidationError(
          `Stock insuffisant depuis la demande : ${transfer.stockItem.quantityOnHand} disponible(s)`
        )
      }

      // Déduire du site source
      await tx.stockItem.update({
        where: { id: transfer.stockItemId },
        data: { quantityOnHand: { decrement: transfer.quantity } },
      })
      await tx.stockMovement.create({
        data: {
          tenantId:   session.tenantId,
          stockItemId: transfer.stockItemId,
          type:       "TRANSFER_OUT",
          quantity:   transfer.quantity,
          reason:     `Transfert vers ${transfer.toSite.name}`,
          operatorId: session.id,
        },
      })

      // Chercher ou créer l'article dans le site destination
      const existing = await tx.stockItem.findFirst({
        where: {
          tenantId: session.tenantId,
          siteId:   transfer.toSiteId,
          name:     transfer.stockItem.name,
        },
        select: { id: true },
      })

      if (existing) {
        await tx.stockItem.update({
          where: { id: existing.id },
          data: { quantityOnHand: { increment: transfer.quantity } },
        })
        await tx.stockMovement.create({
          data: {
            tenantId:   session.tenantId,
            stockItemId: existing.id,
            type:       "TRANSFER_IN",
            quantity:   transfer.quantity,
            reason:     `Transfert depuis ${transfer.fromSite.name}`,
            operatorId: session.id,
          },
        })
      } else {
        // Créer une copie de l'article dans le site destination
        const source = await tx.stockItem.findUnique({
          where: { id: transfer.stockItemId },
          select: { reference: true, name: true, unit: true, minimumLevel: true, unitCostCents: true },
        })
        if (!source) throw new NotFoundError("Article source", transfer.stockItemId)

        // Générer une référence unique si conflit
        const refBase = source.reference
        const refExists = await tx.stockItem.findFirst({
          where: { tenantId: session.tenantId, siteId: transfer.toSiteId, reference: refBase },
        })
        const newRef = refExists ? `${refBase}-TRF` : refBase

        const newItem = await tx.stockItem.create({
          data: {
            tenantId:      session.tenantId,
            siteId:        transfer.toSiteId,
            reference:     newRef,
            name:          source.name,
            unit:          source.unit,
            quantityOnHand: transfer.quantity,
            minimumLevel:  source.minimumLevel,
            unitCostCents: source.unitCostCents,
          },
        })
        await tx.stockMovement.create({
          data: {
            tenantId:   session.tenantId,
            stockItemId: newItem.id,
            type:       "TRANSFER_IN",
            quantity:   transfer.quantity,
            reason:     `Transfert depuis ${transfer.fromSite.name}`,
            operatorId: session.id,
          },
        })
      }

      await tx.stockTransferRequest.update({
        where: { id: transferId },
        data: { status: "COMPLETED", approvedById: session.id, resolvedAt: new Date() },
      })

      // Notifier le demandeur
      await sendNotification(tx, {
        tenantId: session.tenantId,
        userId:   transfer.requestedById,
        type:     "TRANSFER_RESOLVED",
        title:    "Transfert approuvé",
        body:     `${transfer.quantity} × ${transfer.stockItem.name} → ${transfer.toSite.name}`,
        link:     `/stock/transfers/${transferId}`,
      })

      return { status: "COMPLETED" }
    })

    return success(result)
  } catch (error) {
    return handleServerActionError(error)
  }
}
