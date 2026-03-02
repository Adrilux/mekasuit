import { z } from "zod"

// Schéma de validation des variables d'environnement côté serveur
// Le process crash au démarrage si une variable est manquante ou invalide

const appEnvSchema = z.enum(["development", "staging", "production", "debug"])

const serverEnvSchema = z.object({
  // Environnement applicatif
  APP_ENV: appEnvSchema.default("development"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // Base de données (Neon PostgreSQL)
  DATABASE_URL: z.string().min(1, "DATABASE_URL est requis"),
  DATABASE_URL_UNPOOLED: z.string().min(1, "DATABASE_URL_UNPOOLED est requis"),

  // Authentification (Better Auth)
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET doit faire au moins 32 caractères"),
  BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL doit être une URL valide"),

  // IA (Groq) — optionnel si le module AI n'est pas activé
  GROQ_API_KEY: z.string().startsWith("gsk_", "GROQ_API_KEY doit commencer par gsk_").optional(),

  // Email (Resend) — optionnel, best-effort
  RESEND_API_KEY: z.string().startsWith("re_").optional(),
  EMAIL_FROM: z.string().optional(),
  CRON_SECRET: z.string().optional(),

  // Logs
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),

  // Super Admin
  SUPER_ADMIN_EMAIL: z.string().email("SUPER_ADMIN_EMAIL doit être un email valide"),
})

// Valider au démarrage — crash explicite si variable manquante
const parsed = serverEnvSchema.safeParse(process.env)

if (!parsed.success) {
  console.error("Variables d'environnement invalides :")
  console.error(parsed.error.flatten().fieldErrors)
  throw new Error("Variables d'environnement manquantes ou invalides. Voir .env.example")
}

export const serverEnv = parsed.data

export type AppEnv = z.infer<typeof appEnvSchema>
export type ServerEnv = z.infer<typeof serverEnvSchema>
