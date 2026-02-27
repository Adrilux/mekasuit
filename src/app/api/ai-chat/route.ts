import { NextRequest } from "next/server"
import Groq from "groq-sdk"
import { getSession } from "@/lib/auth/auth-session-helpers"
import { serverEnv } from "@/lib/env/env-server-schema"
import { isModuleActive } from "@/lib/modules/module-access-checker"
import { ModuleName } from "@prisma/client"

const SYSTEM_PROMPT = `Tu es un assistant spécialisé en gestion de maintenance industrielle (GMAO).
Tu aides les équipes de maintenance à :
- Diagnostiquer des pannes machines
- Préparer des interventions préventives
- Rédiger des rapports techniques
- Analyser des historiques de maintenance
- Optimiser les plans de maintenance

Réponds en français, de manière concise et pratique.
Quand c'est pertinent, propose des checklists ou des étapes structurées.
Si tu manques d'informations sur une machine spécifique, demande des précisions.`

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return new Response("Unauthorized", { status: 401 })

  const moduleActive = await isModuleActive(session.tenantId, ModuleName.AI_ASSISTANT)
  if (!moduleActive) return new Response("Module AI non activé", { status: 403 })

  if (!serverEnv.GROQ_API_KEY) {
    return new Response("GROQ_API_KEY non configuré", { status: 503 })
  }

  const { messages } = await req.json() as { messages: { role: string; content: string }[] }
  if (!messages?.length) return new Response("Messages requis", { status: 400 })

  const groq = new Groq({ apiKey: serverEnv.GROQ_API_KEY })

  const stream = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    ],
    stream: true,
    max_tokens: 1024,
    temperature: 0.7,
  })

  // Return a ReadableStream with SSE-like chunks
  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      try {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content ?? ""
          if (content) {
            controller.enqueue(encoder.encode(content))
          }
        }
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
