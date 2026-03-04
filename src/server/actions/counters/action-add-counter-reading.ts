"use server"

import { z } from "zod"
import { Prisma, InterventionPriority } from "@prisma/client"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan, assertSiteAccess } from "@/lib/permissions/permission-checker-server"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { NotFoundError, ValidationError } from "@/lib/errors/app-error-classes"

const schema = z.object({
  counterId: z.string().min(1),
  value: z.coerce.number().min(0, "La valeur doit être positive"),
  recordedAt: z.string().optional(), // ISO date string — défaut = maintenant
  note: z.string().max(500).optional(),
})

export async function actionAddCounterReading(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session, "machine:update")

    const data = schema.parse(input)

    const result = await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      const counter = await tx.machineCounter.findUnique({
        where: { id: data.counterId },
        include: {
          machine: { select: { id: true, siteId: true, name: true } },
        },
      })
      if (!counter) throw new NotFoundError("Compteur", data.counterId)
      assertSiteAccess(session, counter.machine.siteId)

      // La valeur du relevé doit être >= valeur courante (compteur monotone)
      if (data.value < counter.currentValue) {
        throw new ValidationError(
          `La valeur saisie (${data.value} ${counter.unit}) est inférieure à la valeur actuelle (${counter.currentValue} ${counter.unit}). Les compteurs ne peuvent pas reculer.`
        )
      }

      const readingDate = data.recordedAt ? new Date(data.recordedAt) : new Date()

      // Créer le relevé
      const reading = await tx.machineCounterReading.create({
        data: {
          tenantId: session.tenantId,
          counterId: data.counterId,
          value: data.value,
          recordedAt: readingDate,
          recordedBy: session.id,
          note: data.note || null,
        },
      })

      // Mettre à jour la valeur courante du compteur
      await tx.machineCounter.update({
        where: { id: data.counterId },
        data: { currentValue: data.value },
      })

      // === DÉCLENCHEMENT AUTOMATIQUE DE PRÉVENTIVE ===
      // Conditions : seuil configuré + titre trigger défini + valeur dépasse le seuil
      let triggeredIntervention: { id: string; title: string } | null = null

      if (
        counter.thresholdValue !== null &&
        counter.thresholdInterval !== null &&
        counter.triggerTitle &&
        data.value >= counter.thresholdValue
      ) {
        // Vérifier qu'il n'existe pas déjà une intervention ouverte pour ce compteur/seuil
        const existingOpen = await tx.intervention.findFirst({
          where: {
            machineId: counter.machine.id,
            title: counter.triggerTitle,
            status: { in: ["OPEN", "IN_PROGRESS", "PENDING_PARTS"] },
          },
          select: { id: true },
        })

        if (!existingOpen) {
          // Créer l'intervention préventive
          const priority = (counter.triggerPriority as InterventionPriority) ?? InterventionPriority.MEDIUM
          const intervention = await tx.intervention.create({
            data: {
              tenantId: session.tenantId,
              siteId: counter.machine.siteId,
              machineId: counter.machine.id,
              title: counter.triggerTitle,
              description: counter.triggerDescription || null,
              type: "PREVENTIVE",
              priority,
              status: "OPEN",
              scheduledAt: readingDate,
            },
          })

          triggeredIntervention = { id: intervention.id, title: intervention.title }

          // Recaler le seuil pour le prochain déclenchement (seuil actuel + intervalle)
          const nextThreshold = counter.thresholdValue + counter.thresholdInterval
          await tx.machineCounter.update({
            where: { id: data.counterId },
            data: { thresholdValue: nextThreshold },
          })
        }
      }

      return { reading, triggeredIntervention }
    })

    return success(result)
  } catch (error) {
    return handleServerActionError(error)
  }
}
