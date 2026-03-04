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
  interventionId: z.string().min(1),
})

export type SuggestedPart = {
  stockItemId: string
  reference: string
  name: string
  quantityOnHand: number
}

export async function actionSuggestParts(input: unknown) {
  try {
    const session = await requireSession()
    assertCan(session, "intervention:read")
    assertCan(session, "stock:read")

    const aiActive = await isModuleActive(session.tenantId, ModuleName.AI_ASSISTANT)
    if (!aiActive) {
      return { success: false, error: "Module AI non activé", code: "MODULE_INACTIVE" }
    }

    const stockActive = await isModuleActive(session.tenantId, ModuleName.STOCK_MANAGEMENT)
    if (!stockActive) {
      return { success: false, error: "Module Stock non activé", code: "MODULE_INACTIVE" }
    }

    if (!serverEnv.GROQ_API_KEY) {
      return { success: false, error: "GROQ_API_KEY non configuré", code: "CONFIG_ERROR" }
    }

    const { interventionId } = schema.parse(input)

    const data = await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      const intervention = await tx.intervention.findUnique({
        where: { id: interventionId },
        select: {
          title: true,
          description: true,
          closingDiagnosis: true,
          type: true,
          siteId: true,
          machine: { select: { name: true, category: true } },
        },
      })

      if (!intervention) return null

      // Load up to 50 stock items from the same site
      const stockItems = await tx.stockItem.findMany({
        where: { siteId: intervention.siteId },
        orderBy: { name: "asc" },
        take: 50,
        select: {
          id: true,
          reference: true,
          name: true,
          quantityOnHand: true,
        },
      })

      return { intervention, stockItems }
    })

    if (!data || !data.intervention) {
      return { success: false, error: "Intervention introuvable", code: "NOT_FOUND" }
    }

    const { intervention, stockItems } = data

    if (stockItems.length === 0) {
      return { success: false, error: "Aucun article dans le catalogue pour ce site", code: "NO_DATA" }
    }

    const catalogLines = stockItems.map((s) => `${s.reference} — ${s.name}`).join("\n")

    const prompt = `Tu es un expert en maintenance industrielle. Analyse cette intervention et suggère les pièces les plus probablement nécessaires.

Intervention :
- Titre : ${intervention.title}
- Type : ${intervention.type}
- Machine : ${intervention.machine?.name ?? "non précisée"}${intervention.machine?.category ? ` (${intervention.machine.category})` : ""}
- Description : ${intervention.description ?? "non renseignée"}
- Diagnostic : ${intervention.closingDiagnosis ?? "non renseigné"}

Catalogue de pièces disponibles (référence — nom) :
${catalogLines}

Suggère les 3 à 5 références les plus pertinentes pour cette intervention.
Réponds UNIQUEMENT avec les références exactes séparées par des virgules, sans aucun autre texte.
Exemple : REF001, REF002, REF003`

    const groq = new Groq({ apiKey: serverEnv.GROQ_API_KEY })
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 100,
      temperature: 0.3,
    })

    const raw = completion.choices[0]?.message?.content?.trim() ?? ""
    if (!raw) {
      return { success: false, error: "L'IA n'a pas retourné de suggestions", code: "AI_EMPTY" }
    }

    // Parse references from AI response
    const suggestedRefs = raw
      .split(",")
      .map((r) => r.trim().toUpperCase())
      .filter((r) => r.length > 0)

    // Match with actual stock items
    const suggestions: SuggestedPart[] = suggestedRefs
      .map((ref) => stockItems.find((s) => s.reference.toUpperCase() === ref))
      .filter((s): s is NonNullable<typeof s> => s !== undefined)
      .map((s) => ({
        stockItemId: s.id,
        reference: s.reference,
        name: s.name,
        quantityOnHand: s.quantityOnHand,
      }))

    if (suggestions.length === 0) {
      return { success: false, error: "Aucune pièce du catalogue ne correspond aux suggestions IA", code: "NO_MATCH" }
    }

    return success(suggestions)
  } catch (error) {
    return handleServerActionError(error)
  }
}
