import { requireSession } from "@/lib/auth/auth-session-helpers"
import { isModuleActive } from "@/lib/modules/module-access-checker"
import { ModuleName } from "@prisma/client"
import { AiChatClient } from "./ai-chat-client"

export default async function AiAssistantPage() {
  const session = await requireSession()
  const active = await isModuleActive(session.tenantId, ModuleName.AI_ASSISTANT)

  if (!active) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <p className="text-4xl mb-4">🤖</p>
        <h1 className="text-lg font-semibold text-slate-900 mb-2">Module non activé</h1>
        <p className="text-sm text-slate-500">
          L&apos;assistant IA n&apos;est pas inclus dans votre abonnement.
          Contactez votre administrateur pour l&apos;activer.
        </p>
      </div>
    )
  }

  return <AiChatClient />
}
