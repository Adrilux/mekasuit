"use server"

import { z } from "zod"
import { Prisma, ModuleName } from "@prisma/client"
import Groq from "groq-sdk"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { isModuleActive } from "@/lib/modules/module-access-checker"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { serverEnv } from "@/lib/env/env-server-schema"

const schema = z.object({
  machineId: z.string().min(1),
})

export async function actionAnalyzeMachineFailures(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session, "intervention:read")

    const moduleActive = await isModuleActive(session.tenantId, ModuleName.AI_ASSISTANT)
    if (!moduleActive) {
      return { success: false, error: "Module AI non activé", code: "MODULE_INACTIVE" }
    }

    if (!serverEnv.GROQ_API_KEY) {
      return { success: false, error: "GROQ_API_KEY non configuré", code: "CONFIG_ERROR" }
    }

    const { machineId } = schema.parse(input)

    const machine = await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      return tx.machine.findFirst({
        where: { id: machineId },
        select: {
          name: true,
          category: true,
          manufacturer: true,
          model: true,
          interventions: {
            where: { type: "CORRECTIVE", status: "CLOSED", closedAt: { not: null } },
            orderBy: { closedAt: "desc" },
            take: 30,
            select: {
              title: true,
              closingDiagnosis: true,
              description: true,
              createdAt: true,
              closedAt: true,
            },
          },
        },
      })
    })

    if (!machine) {
      return { success: false, error: "Machine introuvable", code: "NOT_FOUND" }
    }

    if (machine.interventions.length === 0) {
      return { success: false, error: "Aucune intervention corrective clôturée pour cette machine", code: "NO_DATA" }
    }

    // Build machine info string
    let machineInfo = machine.name
    if (machine.category) machineInfo += ` (${machine.category})`
    if (machine.manufacturer) machineInfo += ` — ${machine.manufacturer}`
    if (machine.model) machineInfo += ` ${machine.model}`

    // Build history string
    const historyLines = machine.interventions.map((i) => {
      const date = i.closedAt ? new Date(i.closedAt).toLocaleDateString("fr-FR") : "date inconnue"
      let line = `- [${date}] ${i.title}`
      if (i.closingDiagnosis) line += ` → Diagnostic : ${i.closingDiagnosis}`
      return line
    })

    const prompt = `Tu es un expert en maintenance industrielle. Analyse l'historique de pannes de la machine suivante.

Machine : ${machineInfo}
Nombre de pannes correctives clôturées : ${machine.interventions.length}

Historique des pannes (de la plus récente à la plus ancienne) :
${historyLines.join("\n")}

Fournis une analyse structurée en français avec les sections suivantes :

## Pannes récurrentes
Identifie les types de pannes qui se répètent (groupe par nature du problème).

## Tendances temporelles
Identifie si la fréquence des pannes augmente, diminue ou reste stable. Note toute accélération récente.

## Actions préventives recommandées
Liste 3 à 5 actions concrètes pour réduire les pannes futures.

## Niveau de risque global
Évalue le risque global de la machine (Faible / Moyen / Élevé) avec une justification courte.

Sois concis, factuel et pratique. Chaque section doit tenir en 3 à 6 lignes.`

    const groq = new Groq({ apiKey: serverEnv.GROQ_API_KEY })
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1024,
      temperature: 0.5,
    })

    const analysis = completion.choices[0]?.message?.content?.trim() ?? ""
    if (!analysis) {
      return { success: false, error: "L'IA n'a pas retourné d'analyse", code: "AI_EMPTY" }
    }

    return success({
      analysis,
      machineName: machine.name,
      failureCount: machine.interventions.length,
    })
  } catch (error) {
    return handleServerActionError(error)
  }
}
