import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "@/lib/db/prisma-client-singleton"
import { serverEnv } from "@/lib/env/env-server-schema"

// Configuration Better Auth côté serveur
// Gère l'authentification et les sessions avec contexte tenant

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  secret: serverEnv.BETTER_AUTH_SECRET,
  baseURL: serverEnv.BETTER_AUTH_URL,

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: serverEnv.APP_ENV === "production",
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 jours
    updateAge: 60 * 60 * 24,      // renouvelle si > 1 jour restant
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // cache session côté client 5 minutes
    },
  },

  // Données supplémentaires stockées dans la session utilisateur
  // Le tenantId et le rôle sont injectés après lookup en DB
  user: {
    additionalFields: {
      tenantId: {
        type: "string",
        required: false,
        input: false, // non fourni à la création, assigné lors de l'onboarding
      },
    },
  },
})

export type Auth = typeof auth
