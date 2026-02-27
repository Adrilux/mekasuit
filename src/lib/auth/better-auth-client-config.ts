"use client"

import { createAuthClient } from "better-auth/react"
import { clientEnv } from "@/lib/env/env-client-schema"

// Client Better Auth pour les composants React côté client
// Fournit les hooks useSession, signIn, signOut etc.

export const authClient = createAuthClient({
  baseURL: clientEnv.NEXT_PUBLIC_APP_URL,
})

export const { signIn, signOut, signUp, useSession } = authClient
