/**
 * Vérifie si un article de stock est sous son seuil après modification
 * et envoie une notification aux admins/managers du site.
 */
import { Prisma } from "@prisma/client"
import { sendNotificationToMany } from "./notification-sender"

type StockLowCheckInput = {
  tx: Prisma.TransactionClient
  tenantId: string
  stockItemId: string
  stockItemName: string
  siteId: string
  newQuantity: number
  minimumLevel: number
}

/**
 * À appeler APRÈS avoir mis à jour la quantité en stock.
 * Si newQuantity <= minimumLevel (et minimumLevel > 0), notifie
 * tous les client_admin et workshop_manager du tenant.
 */
export async function notifyIfStockLow(input: StockLowCheckInput): Promise<void> {
  const { tx, tenantId, stockItemId, stockItemName, siteId, newQuantity, minimumLevel } = input

  if (minimumLevel <= 0 || newQuantity > minimumLevel) return

  // Trouver les admins et managers du tenant qui ont accès à ce site
  const managers = await tx.tenantUser.findMany({
    where: {
      tenantId,
      isActive: true,
      role: { in: ["client_admin", "workshop_manager"] },
      userSites: { some: { siteId } },
    },
    select: { authUserId: true },
  })

  // Les client_admin ont accès à tous les sites — les inclure même sans UserSite
  const admins = await tx.tenantUser.findMany({
    where: { tenantId, isActive: true, role: "client_admin" },
    select: { authUserId: true },
  })

  const userIds = [
    ...new Set([
      ...managers.map((u) => u.authUserId),
      ...admins.map((u) => u.authUserId),
    ]),
  ]

  if (userIds.length === 0) return

  await sendNotificationToMany(tx, userIds, {
    tenantId,
    type: "STOCK_LOW",
    title: "Stock en rupture",
    body: `${stockItemName} : ${newQuantity} unité(s) restante(s) (seuil : ${minimumLevel})`,
    link: `/stock/${stockItemId}`,
  })
}
