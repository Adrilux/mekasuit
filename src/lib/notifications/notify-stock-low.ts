/**
 * Vérifie si un article de stock est sous son seuil après modification
 * et envoie une notification aux admins/managers du site.
 */
import { Prisma } from "@prisma/client"
import { sendNotificationToMany } from "./notification-sender"
import { sendEmail } from "@/lib/email/email-sender"
import { buildStockLowEmail } from "@/lib/email/templates/email-stock-low"
import { queryGetUsersByAuthIds } from "@/server/queries/users/query-get-users-by-auth-ids"
import { serverEnv } from "@/lib/env/env-server-schema"

type StockLowCheckInput = {
  tx: Prisma.TransactionClient
  tenantId: string
  stockItemId: string
  stockItemName: string
  stockItemReference?: string
  siteId: string
  siteName?: string
  newQuantity: number
  minimumLevel: number
}

/**
 * À appeler APRÈS avoir mis à jour la quantité en stock.
 * Si newQuantity <= minimumLevel (et minimumLevel > 0), notifie
 * tous les client_admin et workshop_manager du tenant.
 */
export async function notifyIfStockLow(input: StockLowCheckInput): Promise<void> {
  const { tx, tenantId, stockItemId, stockItemName, stockItemReference, siteId, siteName, newQuantity, minimumLevel } = input

  if (minimumLevel <= 0 || newQuantity > minimumLevel) return

  // Trouver tous les utilisateurs actifs avec la permission notifications:receive
  // qui ont accès au site (soit via site:view-all, soit via UserSite direct)
  const usersWithNotifPerm = await tx.tenantUser.findMany({
    where: {
      tenantId,
      isActive: true,
      tenantRole: { permissions: { has: "notifications:receive" } },
    },
    select: {
      authUserId: true,
      tenantRole: { select: { permissions: true } },
      userSites: { select: { siteId: true } },
    },
  })

  const userIds = usersWithNotifPerm
    .filter((u) => {
      const perms = u.tenantRole?.permissions ?? []
      // Accès à tous les sites ou assigné à ce site spécifiquement
      return perms.includes("site:view-all") || u.userSites.some((s) => s.siteId === siteId)
    })
    .map((u) => u.authUserId)

  if (userIds.length === 0) return

  await sendNotificationToMany(tx, userIds, {
    tenantId,
    type: "STOCK_LOW",
    title: "Stock en rupture",
    body: `${stockItemName} : ${newQuantity} unité(s) restante(s) (seuil : ${minimumLevel})`,
    link: `/stock/${stockItemId}`,
  })

  // Emails aux managers — hors transaction, best-effort
  void (async () => {
    const users = await queryGetUsersByAuthIds(userIds)
    const appUrl = serverEnv.BETTER_AUTH_URL

    await Promise.all(
      users.map((user) => {
        if (!user.email) return Promise.resolve()
        const html = buildStockLowEmail({
          recipientName: user.name,
          articleName: stockItemName,
          articleReference: stockItemReference ?? stockItemId,
          quantityOnHand: newQuantity,
          minimumQuantity: minimumLevel,
          siteName,
          appUrl,
        })
        return sendEmail({
          to: user.email,
          subject: `⚠️ Stock bas : ${stockItemName} — ${newQuantity} restant(s)`,
          html,
        })
      })
    )
  })()
}
