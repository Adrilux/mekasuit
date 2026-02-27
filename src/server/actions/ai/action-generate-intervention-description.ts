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
  title: z.string().min(3).max(200),
  machineId: z.string().optional(),
  type: z.enum(["CORRECTIVE", "PREVENTIVE", "PREDICTIVE", "INSPECTION"]),
})

export async function actionGenerateInterventionDescription(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session.role, "intervention:create")

    const moduleActive = await isModuleActive(session.tenantId, ModuleName.AI_ASSISTANT)
    if (!moduleActive) {
      return { success: false, error: "Module AI non activé", code: "MODULE_INACTIVE" }
    }

    if (!serverEnv.GROQ_API_KEY) {
      return { success: false, error: "GROQ_API_KEY non configuré", code: "CONFIG_ERROR" }
    }

    const data = schema.parse(input)

    // Charger le contexte machine si fourni
    let machineContext = ""
    if (data.machineId) {
      const machineInfo = await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
        return tx.machine.findFirst({
          where: { id: data.machineId },
          select: {
            name: true,
            category: true,
            manufacturer: true,
            model: true,
            interventions: {
              where: { status: "CLOSED", type: "CORRECTIVE" },
              orderBy: { closedAt: "desc" },
              take: 5,
              select: { title: true, closingDiagnosis: true, closedAt: true },
            },
          },
        })
      })

      if (machineInfo) {
        machineContext = `\n\nMachine concernée : ${machineInfo.name}`
        if (machineInfo.category) machineContext += ` (${machineInfo.category})`
        if (machineInfo.manufacturer) machineContext += ` — ${machineInfo.manufacturer}`
        if (machineInfo.model) machineContext += ` ${machineInfo.model}`

        if (machineInfo.interventions.length > 0) {
          machineContext += `\n\nHistorique des 5 dernières pannes :`
          for (const i of machineInfo.interventions) {
            machineContext += `\n- ${i.title}`
            if (i.closingDiagnosis) machineContext += ` → ${i.closingDiagnosis}`
          }
        }
      }
    }

    const typeLabel = {
      CORRECTIVE: "corrective (panne)",
      PREVENTIVE: "préventive",
      PREDICTIVE: "prédictive",
      INSPECTION: "inspection",
    }[data.type]

    const prompt = `Tu es un expert en maintenance industrielle. Génère une description professionnelle et détaillée pour une intervention de type **${typeLabel}** avec le titre : "${data.title}".${machineContext}

La description doit :
- Expliquer le contexte et la nature du problème/tâche
- Lister les étapes principales à réaliser (3-6 étapes)
- Mentionner les précautions ou vérifications importantes
- Être concise (5-10 lignes maximum)
- Être rédigée pour un technicien de maintenance

Réponds uniquement avec la description, sans titre ni formatage markdown superflu.`

    const groq = new Groq({ apiKey: serverEnv.GROQ_API_KEY })
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 512,
      temperature: 0.6,
    })

    const description = completion.choices[0]?.message?.content?.trim() ?? ""
    if (!description) {
      return { success: false, error: "L'IA n'a pas retourné de description", code: "AI_EMPTY" }
    }

    return success(description)
  } catch (error) {
    return handleServerActionError(error)
  }
}
