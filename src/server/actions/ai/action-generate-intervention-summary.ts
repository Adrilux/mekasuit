"use server"

import { z } from "zod"
import { Prisma, ModuleName } from "@prisma/client"
import Groq from "groq-sdk"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertCan } from "@/lib/permissions/permission-checker-server"
import { withTenantContext } from "@/lib/db/prisma-with-rls-context"
import { isModuleActive } from "@/lib/modules/module-access-checker"
import { buildUserNameMap } from "@/server/queries/users/query-get-users-by-auth-ids"
import { handleServerActionError, success } from "@/lib/errors/error-handler-server"
import { serverEnv } from "@/lib/env/env-server-schema"

const schema = z.object({
  interventionId: z.string().min(1),
})

const TYPE_LABELS: Record<string, string> = {
  CORRECTIVE: "Corrective (panne)",
  PREVENTIVE: "Préventive",
  PREDICTIVE: "Prédictive",
  INSPECTION: "Inspection",
}

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Basse",
  MEDIUM: "Moyenne",
  HIGH: "Haute",
  CRITICAL: "Critique",
}

export async function actionGenerateInterventionSummary(input: unknown) {
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

    const { interventionId } = schema.parse(input)

    const intervention = await withTenantContext(session.tenantId, async (tx: Prisma.TransactionClient) => {
      return tx.intervention.findUnique({
        where: { id: interventionId, status: "CLOSED" },
        select: {
          title: true,
          type: true,
          priority: true,
          description: true,
          closingDiagnosis: true,
          actualDurationMinutes: true,
          createdAt: true,
          closedAt: true,
          assignedUserId: true,
          machine: { select: { name: true, category: true } },
          notes: {
            orderBy: { createdAt: "desc" },
            take: 5,
            select: { content: true, createdAt: true },
          },
          partsUsed: {
            select: {
              quantity: true,
              stockItem: { select: { name: true, reference: true } },
            },
          },
        },
      })
    })

    if (!intervention) {
      return { success: false, error: "Intervention introuvable ou non clôturée", code: "NOT_FOUND" }
    }

    // Resolve technician name
    let technicianName = "Non assigné"
    if (intervention.assignedUserId) {
      const nameMap = await buildUserNameMap([intervention.assignedUserId])
      technicianName = nameMap.get(intervention.assignedUserId) ?? "Inconnu"
    }

    const formatDate = (d: Date | null) =>
      d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—"

    const duration = intervention.actualDurationMinutes
      ? intervention.actualDurationMinutes >= 60
        ? `${Math.floor(intervention.actualDurationMinutes / 60)} h ${intervention.actualDurationMinutes % 60} min`
        : `${intervention.actualDurationMinutes} min`
      : "Non renseignée"

    const partsLines = intervention.partsUsed.length > 0
      ? intervention.partsUsed.map((p) => `${p.stockItem.name} (${p.stockItem.reference}) × ${p.quantity}`).join(", ")
      : "Aucune pièce consommée"

    const notesLines = intervention.notes.length > 0
      ? intervention.notes.map((n) => `- ${n.content.slice(0, 200)}`).join("\n")
      : "Aucune note"

    const prompt = `Rédige un résumé professionnel de cette intervention de maintenance (8 à 12 lignes maximum).

Titre : ${intervention.title}
Type : ${TYPE_LABELS[intervention.type] ?? intervention.type}
Priorité : ${PRIORITY_LABELS[intervention.priority] ?? intervention.priority}
Machine : ${intervention.machine?.name ?? "Non précisée"}${intervention.machine?.category ? ` (${intervention.machine.category})` : ""}
Technicien : ${technicianName}
Période : ${formatDate(intervention.createdAt)} → ${formatDate(intervention.closedAt)}
Durée réelle : ${duration}
Description : ${intervention.description ?? "Non renseignée"}
Diagnostic final : ${intervention.closingDiagnosis ?? "Non renseigné"}
Pièces utilisées : ${partsLines}
Notes de l'intervention :
${notesLines}

Le résumé doit être :
- Professionnel et factuel, rédigé à la 3ème personne
- Destiné à une archive ou un rapport client
- Sans liste à puces, en texte continu
- En français

Réponds uniquement avec le résumé, sans titre.`

    const groq = new Groq({ apiKey: serverEnv.GROQ_API_KEY })
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 512,
      temperature: 0.5,
    })

    const summary = completion.choices[0]?.message?.content?.trim() ?? ""
    if (!summary) {
      return { success: false, error: "L'IA n'a pas retourné de résumé", code: "AI_EMPTY" }
    }

    return success(summary)
  } catch (error) {
    return handleServerActionError(error)
  }
}
