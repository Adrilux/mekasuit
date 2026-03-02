/**
 * Check cross-tenant pour les interventions en retard.
 * Appelé par la route cron /api/cron/check-overdue.
 *
 * Pour chaque tenant actif :
 * - Cherche les interventions OPEN/IN_PROGRESS/PENDING_PARTS avec scheduledAt < now()
 * - Dédoublonnage : vérifie qu'aucune notif INTERVENTION_OVERDUE n'existe dans les 24h
 * - Crée notif in-app + email au technicien assigné
 * - Email récap groupé aux managers (1 email par manager listant toutes les interventions en retard)
 */
import { prisma } from "@/lib/db/prisma-client-singleton"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { sendNotification } from "./notification-sender"
import { sendEmail } from "@/lib/email/email-sender"
import { buildInterventionOverdueEmail, buildOverdueManagerSummaryEmail } from "@/lib/email/templates/email-intervention-overdue"
import { queryGetUsersByAuthIds } from "@/server/queries/users/query-get-users-by-auth-ids"
import { serverEnv } from "@/lib/env/env-server-schema"

export async function notifyInterventionsOverdue(): Promise<number> {
  // Récupérer tous les tenants — sans RLS (super-admin)
  const tenants = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "tenant" WHERE "isActive" = true
  `

  const appUrl = serverEnv.BETTER_AUTH_URL
  const now = new Date()
  const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const formatDate = (d: Date) =>
    d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })

  let totalProcessed = 0

  for (const tenant of tenants) {
    try {
      await withTenantContext(tenant.id, async (tx) => {
        // Interventions en retard pour ce tenant
        const overdueInterventions = await tx.intervention.findMany({
          where: {
            status: { in: ["OPEN", "IN_PROGRESS", "PENDING_PARTS"] },
            scheduledAt: { lt: now },
          },
          select: {
            id: true,
            title: true,
            priority: true,
            scheduledAt: true,
            assignedUserId: true,
            machine: { select: { name: true } },
          },
        })

        if (overdueInterventions.length === 0) return

        // Filtrer celles qui ont déjà une notif dans les 24h (dédoublonnage)
        const alreadyNotifiedIds = await tx.notification.findMany({
          where: {
            type: "INTERVENTION_OVERDUE",
            createdAt: { gte: since24h },
            link: { in: overdueInterventions.map((i) => `/interventions/${i.id}`) },
          },
          select: { link: true },
        })

        const notifiedLinks = new Set(alreadyNotifiedIds.map((n) => n.link))
        const toNotify = overdueInterventions.filter(
          (i) => !notifiedLinks.has(`/interventions/${i.id}`)
        )

        if (toNotify.length === 0) return

        // Récupérer les managers du tenant pour l'email récap
        const managers = await tx.tenantUser.findMany({
          where: {
            tenantId: tenant.id,
            isActive: true,
            role: { in: ["client_admin", "workshop_manager"] },
          },
          select: { authUserId: true },
        })

        const managerIds = [...new Set(managers.map((m) => m.authUserId))]

        // Envoyer notif in-app à chaque technicien assigné
        for (const intervention of toNotify) {
          if (intervention.assignedUserId) {
            await sendNotification(tx, {
              tenantId: tenant.id,
              userId: intervention.assignedUserId,
              type: "INTERVENTION_OVERDUE",
              title: "Intervention en retard",
              body: `L'intervention "${intervention.title}" dépasse sa date planifiée`,
              link: `/interventions/${intervention.id}`,
            })
          }

          // Notif aux managers
          for (const managerId of managerIds) {
            if (managerId !== intervention.assignedUserId) {
              await sendNotification(tx, {
                tenantId: tenant.id,
                userId: managerId,
                type: "INTERVENTION_OVERDUE",
                title: "Intervention en retard",
                body: `"${intervention.title}" dépasse sa date planifiée`,
                link: `/interventions/${intervention.id}`,
              })
            }
          }

          totalProcessed++
        }

        // Emails — hors transaction, best-effort
        void (async () => {
          // 1. Email individuel au technicien assigné pour chaque intervention
          const assignedIds = [
            ...new Set(toNotify.map((i) => i.assignedUserId).filter((id): id is string => id !== null)),
          ]

          const techUsers = assignedIds.length > 0 ? await queryGetUsersByAuthIds(assignedIds) : []
          const techMap = new Map(techUsers.map((u) => [u.id, u]))

          for (const intervention of toNotify) {
            if (!intervention.assignedUserId) continue
            const tech = techMap.get(intervention.assignedUserId)
            if (!tech?.email) continue

            const html = buildInterventionOverdueEmail({
              recipientName: tech.name,
              interventionTitle: intervention.title,
              interventionId: intervention.id,
              machineName: intervention.machine?.name,
              scheduledAt: formatDate(intervention.scheduledAt!),
              priority: intervention.priority,
              appUrl,
            })

            await sendEmail({
              to: tech.email,
              subject: `⚠️ Intervention en retard : ${intervention.title}`,
              html,
            })
          }

          // 2. Email récap groupé aux managers
          if (managerIds.length > 0) {
            const managerUsers = await queryGetUsersByAuthIds(managerIds)

            // Résoudre les noms de techniciens pour le récap
            const techNamesMap = new Map(techUsers.map((u) => [u.id, u.name]))

            const summaryRows = toNotify.map((i) => ({
              id: i.id,
              title: i.title,
              machineName: i.machine?.name,
              scheduledAt: formatDate(i.scheduledAt!),
              technicianName: i.assignedUserId ? (techNamesMap.get(i.assignedUserId) ?? "—") : "Non assigné",
            }))

            await Promise.all(
              managerUsers.map((manager) => {
                if (!manager.email) return Promise.resolve()
                const html = buildOverdueManagerSummaryEmail({
                  managerName: manager.name,
                  interventions: summaryRows,
                  appUrl,
                })
                return sendEmail({
                  to: manager.email,
                  subject: `⚠️ ${toNotify.length} intervention(s) en retard`,
                  html,
                })
              })
            )
          }
        })()
      })
    } catch (err) {
      console.error(`[overdue] Erreur pour tenant ${tenant.id} :`, err)
    }
  }

  return totalProcessed
}
