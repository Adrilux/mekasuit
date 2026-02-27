import { z } from "zod"

// Variables d'environnement exposées au client (préfixe NEXT_PUBLIC_)
// Ne jamais mettre de secrets ici

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url("NEXT_PUBLIC_APP_URL doit être une URL valide")
    .default("http://localhost:3000"),
  NEXT_PUBLIC_APP_NAME: z.string().default("GMAO SaaS"),
})

const parsed = clientEnvSchema.safeParse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
})

if (!parsed.success) {
  console.error("Variables d'environnement client invalides :", parsed.error.flatten())
  throw new Error("Variables NEXT_PUBLIC_ invalides")
}

export const clientEnv = parsed.data
